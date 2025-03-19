import { Box } from '@sparrowengg/twigs-react';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'; // Adjust the import path as necessary

const Barchart = ({ data }) => {
  // Prepare data for the chart
  const chartData = data.map(item => {
    const dataPoint = { jobTitle: item.title };
    item.statusDetails.forEach(status => {
      dataPoint[status.id] = status.value; // Use the id as the key
    });
    return dataPoint;
  });

  // Define an array of colors for the bars
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d0ed57'];

  return (
    <Box css={{
      backgroundColor: '$white900',
    }}>
      <BarChart
        width={800}
        height={450}
        data={chartData}
        margin={{ top: 20, right: 30, left: 50, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="jobTitle"
          angle={-30}
          textAnchor="end"
        />
        <YAxis />
        <Tooltip />
        {/* <Legend /> */}
        {data[0].statusDetails.map((status, index) => (
          <Bar key={status.id} dataKey={status.id} fill={colors[index % colors.length]} />
        ))}
      </BarChart>
    </Box>
  );
};

export default Barchart;