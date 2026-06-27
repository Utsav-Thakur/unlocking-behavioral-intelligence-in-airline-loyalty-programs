import React from 'react';
import { num } from '../utils/formatters';

const ConfusionMatrix = () => {
  const categories = [
    { id: 'P1', name: 'Elite Loyalists' },
    { id: 'P2', name: 'Standard Members' },
    { id: 'P3', name: 'Casual Travelers' },
    { id: 'P4', name: 'At-Risk Flyers' }
  ];

  // Matrix values: row = actual, col = predicted
  // Diagonal elements are correct classifications
  const matrix = [
    [2420, 64, 15, 12],  // Actual P1
    [85, 5930, 180, 105], // Actual P2
    [25, 240, 4720, 115], // Actual P3
    [8, 78, 92, 2680]    // Actual P4
  ];

  // Calculate totals for percentages
  const total = matrix.flat().reduce((sum, val) => sum + val, 0);
  const correct = matrix.reduce((sum, row, i) => sum + row[i], 0);
  const accuracy = (correct / total) * 100;

  // Determine error cell bg intensity based on value size
  const getErrorOpacityClass = (value) => {
    if (value > 200) return 'bg-danger/30 text-danger border-danger/30';
    if (value > 100) return 'bg-danger/20 text-danger/90 border-danger/20';
    if (value > 50) return 'bg-danger/10 text-danger/85 border-danger/10';
    return 'bg-danger/5 text-danger/60 border-danger/5';
  };

  return (
    <div className="w-full card p-5 select-none relative overflow-visible">
      {/* Title */}
      <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
        <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          <span>Confusion Matrix (XGBoost Performance)</span>
        </h3>
        <span className="text-[10px] text-success border border-success/30 bg-success/15 px-2 py-0.5 rounded-full font-bold">
          Accuracy: {accuracy.toFixed(1)}%
        </span>
      </div>

      <div className="flex flex-col items-center justify-center p-2">
        {/* Matrix Wrapper */}
        <div className="relative w-full max-w-[420px]">
          
          {/* Axis Header: Predicted (Top) */}
          <div className="text-center text-[10px] font-bold uppercase tracking-wider text-accent mb-2">
            Predicted Class
          </div>

          {/* Semicircle layout grid: 5 columns (1 label + 4 categories) */}
          <div className="grid grid-cols-5 gap-1.5">
            {/* Cell 0,0: Actual label placement (Y-axis label) */}
            <div className="flex items-center justify-center text-[9px] font-bold text-text-secondary uppercase select-none leading-none">
              Actual
            </div>
            
            {/* Predicted class headers */}
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="flex flex-col items-center justify-center p-1 border border-border/40 bg-card-hover/40 rounded text-center cursor-help"
                title={`${cat.id}: ${cat.name}`}
              >
                <span className="text-[10px] font-bold text-accent">{cat.id}</span>
                <span className="text-[8px] text-text-secondary hidden sm:inline truncate w-full">{cat.name.split(' ')[0]}</span>
              </div>
            ))}

            {/* Matrix Data Rows */}
            {categories.map((rowCat, rowIndex) => (
              <React.Fragment key={rowCat.id}>
                {/* Left Label: Actual class */}
                <div 
                  className="flex flex-col justify-center items-end pr-2 border-r border-border/30 text-right cursor-help"
                  title={`${rowCat.id}: ${rowCat.name}`}
                >
                  <span className="text-[10px] font-bold text-text-primary">{rowCat.id}</span>
                  <span className="text-[8px] text-text-secondary hidden sm:inline truncate max-w-[65px]">{rowCat.name.split(' ')[0]}</span>
                </div>

                {/* 4 columns in the row */}
                {matrix[rowIndex].map((val, colIndex) => {
                  const isCorrect = rowIndex === colIndex;
                  const percentOfActual = (val / matrix[rowIndex].reduce((a, b) => a + b, 0)) * 100;

                  return (
                    <div
                      key={colIndex}
                      className={`aspect-square border rounded flex flex-col items-center justify-center transition-all p-1 cursor-help ${
                        isCorrect
                          ? 'bg-success/20 text-success border-success/40 hover:bg-success/30 font-bold'
                          : getErrorOpacityClass(val)
                      }`}
                      title={`Actual ${rowCat.name} predicted as ${categories[colIndex].name}: ${num(val)} (${percentOfActual.toFixed(1)}%)`}
                    >
                      <span className="text-xs font-display">{num(val)}</span>
                      <span className="text-[8px] opacity-75 mt-0.5">{percentOfActual.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Legend description */}
        <div className="mt-4 flex gap-4 text-[10px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-success/20 border border-success/40" />
            <span>Correct Classifications</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-danger/20 border border-danger/40" />
            <span>Errors (Opacity shows density)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
