"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const testData = [
  { name: 'Views', value: 100 },
  { name: 'Prints', value: 50 },
  { name: 'Shares', value: 25 },
];

export function TestChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-64 p-4 border rounded flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Test Chart (Recharts) - Mounted: {mounted ? 'Yes' : 'No'}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={testData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}