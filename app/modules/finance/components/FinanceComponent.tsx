import React from 'react';
import { Fund } from '../types';
import { TrendingUp, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils';

interface FinanceComponentProps {
  funds: Fund[];
  onUpdateFund: (fund: Fund) => Promise<Fund>;
}

export const FinanceComponent: React.FC<FinanceComponentProps> = ({ funds, onUpdateFund }) => {

  const totalFundSavings = funds.reduce((acc, fund) => acc + fund.currentAmount, 0);
  const totalFundTarget = funds.reduce((acc, fund) => acc + fund.targetAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Family Finance</h2>
          <p className="text-slate-500">Managing savings goals.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="text-emerald-600" size={24} />
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Savings</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{formatCurrency(totalFundSavings)}</div>
            <div className="text-sm text-slate-500">of {formatCurrency(totalFundTarget)} target</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-slate-600" size={24} />
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Savings Progress</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{totalFundTarget > 0 ? Math.round((totalFundSavings / totalFundTarget) * 100) : 0}%</div>
            <div className="text-sm text-slate-500">overall completion</div>
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Savings Goals</h3>
          <div className="space-y-4">
            {funds.map(fund => (
              <div key={fund.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{fund.name}</span>
                  <span className="text-sm text-slate-500">
                    {formatCurrency(fund.currentAmount)} / {formatCurrency(fund.targetAmount)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((fund.currentAmount / fund.targetAmount) * 100, 100)}%`,
                      backgroundColor: fund.color
                    }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500">
                  {Math.round((fund.currentAmount / fund.targetAmount) * 100)}% complete
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
