// Check projects table schema
import { supabase } from './lib/supabaseClient';

async function checkProjectsSchema(): Promise<void> {
  console.log('Checking projects table schema...');

  try {
    // Try to select all columns from projects table to see structure
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying projects table:', error);
    } else {
      console.log('Projects table exists');
      if (data && data.length > 0) {
        console.log('Sample project record:', data[0]);
        console.log('Available columns:', Object.keys(data[0]));
        console.log('Has is_active column:', 'is_active' in data[0]);
      } else {
        console.log('No projects found in table');
      }
    }
  } catch (err) {
    console.error('Connection test error:', err);
  }
}

checkProjectsSchema();

