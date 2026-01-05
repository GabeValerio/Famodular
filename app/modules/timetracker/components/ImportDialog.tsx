'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, X, Sparkles } from 'lucide-react';
import { TimeTrackerProject, ImportEntryData, ImportValidationError } from '../types';
import { parseTimeEntriesWithGemini, ParsedTimeEntry } from '@/lib/services/geminiService';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: TimeTrackerProject[];
  onImport: (csvText: string, projectId?: string) => Promise<{ success: boolean; importedCount: number; errors: ImportValidationError[] }>;
  groupId?: string;
}

export function ImportDialog({ open, onOpenChange, projects, onImport, groupId }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<ImportEntryData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; importedCount: number; errors: ImportValidationError[] } | null>(null);

  // AI Import state
  const [importMode, setImportMode] = useState<'csv' | 'ai'>('csv');
  const [aiInputText, setAiInputText] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCsvText('');
      setParsedData([]);
      setValidationErrors([]);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
        parseAndValidateCSV(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    setFile(null);
    setImportResult(null);
    parseAndValidateCSV(text);
  };

  const parseAndValidateCSV = (text: string) => {
    if (!text.trim()) {
      setParsedData([]);
      setValidationErrors([]);
      return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    const data: ImportEntryData[] = [];
    const errors: ImportValidationError[] = [];

    // Skip header row if it exists
    const startIndex = lines[0]?.toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
      const rowNumber = i + 1;

      if (parts.length < 3) {
        errors.push({
          row: rowNumber,
          field: 'general',
          message: 'Row must have at least 3 columns: date, start_time, end_time'
        });
        continue;
      }

      const [date, startTime, endTime, description] = parts;

      // Validate date format (MM/DD/YYYY)
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (!dateRegex.test(date)) {
        errors.push({
          row: rowNumber,
          field: 'date',
          message: 'Date must be in MM/DD/YYYY format'
        });
      }

      // Validate time format (12-hour with AM/PM)
      const timeRegex = /^\d{1,2}:\d{2}\s+(AM|PM)$/i;
      if (!timeRegex.test(startTime)) {
        errors.push({
          row: rowNumber,
          field: 'startTime',
          message: 'Start time must be in H:MM AM/PM format (e.g., 7:55 PM)'
        });
      }

      if (endTime && !timeRegex.test(endTime)) {
        errors.push({
          row: rowNumber,
          field: 'endTime',
          message: 'End time must be in H:MM AM/PM format (e.g., 7:55 PM)'
        });
      }

      // Additional validation: check if date is valid
      if (dateRegex.test(date)) {
        const [month, day, year] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
        if (isNaN(dateObj.getTime()) || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day || dateObj.getFullYear() !== year) {
          errors.push({
            row: rowNumber,
            field: 'date',
            message: 'Invalid date'
          });
        }
      }

      // If no errors for this row, add to data
      if (!errors.some(error => error.row === rowNumber)) {
        data.push({
          date,
          startTime,
          endTime,
          description: description || undefined,
        });
      }
    }

    setParsedData(data);
    setValidationErrors(errors);
  };

  const handleAIParse = async () => {
    if (!aiInputText.trim()) return;

    setIsParsingAI(true);
    try {
      const parsedEntries = await parseTimeEntriesWithGemini(aiInputText);

      // Convert ParsedTimeEntry to ImportEntryData format
      const convertedData: ImportEntryData[] = parsedEntries.map(entry => ({
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        description: entry.description
      }));

      setParsedData(convertedData);
      setValidationErrors([]);
      setImportMode('csv'); // Switch to CSV mode to show the parsed data
      setCsvText(''); // Clear CSV text since we're using AI parsed data
    } catch (error) {
      setValidationErrors([{
        row: 0,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to parse with AI'
      }]);
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleImport = async () => {
    if (importMode === 'ai' && !parsedData.length) return;
    if (importMode === 'csv' && (!csvText.trim() || validationErrors.length > 0)) return;

    setIsImporting(true);
    try {
      const projectId = selectedProjectId === 'none' ? undefined : selectedProjectId;

      if (importMode === 'ai') {
        // Convert parsed data back to CSV format for import
        const csvLines = parsedData.map(entry =>
          `${entry.date},${entry.startTime},${entry.endTime || ''},${entry.description || ''}`
        );
        const csvContent = csvLines.join('\n');
        const result = await onImport(csvContent, projectId);
        setImportResult(result);
      } else {
        const result = await onImport(csvText, projectId);
        setImportResult(result);
      }
    } catch (error) {
      setImportResult({
        success: false,
        importedCount: 0,
        errors: [{ row: 0, field: 'general', message: error instanceof Error ? error.message : 'Import failed' }]
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setCsvText('');
    setParsedData([]);
    setValidationErrors([]);
    setSelectedProjectId('none');
    setImportResult(null);
    setIsImporting(false);
    setImportMode('csv');
    setAiInputText('');
    setIsParsingAI(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Time Entries
          </DialogTitle>
          <DialogDescription>
            Import time entries using CSV format or natural language with AI assistance.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={importMode} onValueChange={(value) => setImportMode(value as 'csv' | 'ai')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {file.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Or paste CSV text */}
            <div className="space-y-2">
              <Label htmlFor="csv-text">Or paste CSV data</Label>
              <Textarea
                id="csv-text"
                placeholder="date,start_time,end_time,description&#10;01/15/2024,9:00 AM,5:00 PM,Worked on project planning&#10;01/16/2024,10:00 AM,4:30 PM,Development and testing"
                value={csvText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: date,start_time,end_time,description (description optional)<br/>
                Date: MM/DD/YYYY, Time: H:MM AM/PM (e.g., 7:55 PM)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-input">Describe your time entries in natural language</Label>
              <Textarea
                id="ai-input"
                placeholder="Example:\n7/14/25 10:15-12:15pm meeting\n7/15/25 7:30-7:45\n12/24/25 - 11:30 - 12:30\n3-5pm"
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAIParse}
                  disabled={!aiInputText.trim() || isParsingAI}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {isParsingAI ? 'Parsing...' : 'Parse with AI'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  AI will extract dates, times, and descriptions from your text
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="import-project">Import into Project (optional)</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <Badge variant="secondary" style={{ backgroundColor: selectedProject.color + '20', color: selectedProject.color }}>
                {selectedProject.name}
              </Badge>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Found {validationErrors.length} validation error(s):</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>
                      Row {error.row}: {error.field !== 'general' ? `${error.field} - ` : ''}{error.message}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>... and {validationErrors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          {parsedData.length > 0 && validationErrors.length === 0 && (
            <div className="space-y-2">
              <Label>Preview ({parsedData.length} entries)</Label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead className="w-20">Start</TableHead>
                      <TableHead className="w-20">End</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{entry.date}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.startTime}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.endTime || '-'}</TableCell>
                        <TableCell className="text-sm">{entry.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {parsedData.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                          ... and {parsedData.length - 5} more entries
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.success ? "default" : "destructive"}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {importResult.success ? (
                  <span className="font-medium text-green-700">
                    Successfully imported {importResult.importedCount} entries!
                  </span>
                ) : (
                  <div>
                    <div className="font-medium mb-2">Import failed:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>
                          {error.row > 0 ? `Row ${error.row}: ` : ''}{error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              (importMode === 'csv' && (!csvText.trim() || validationErrors.length > 0)) ||
              (importMode === 'ai' && !parsedData.length) ||
              isImporting
            }
          >
            {isImporting ? 'Importing...' : `Import ${parsedData.length} Entries`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
