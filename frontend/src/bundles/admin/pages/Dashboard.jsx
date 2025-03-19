import { Flex } from "@sparrowengg/twigs-react";
import IntroMap from "../../../components/admin/Dashboard/IntroMap";
import Barchart from "../../../components/admin/Dashboard/Barchart";


const dummyData = [
  {
    id: 'job1',
    title: 'Software Engineer',
    statusDetails: [
      { id: 'application', value: 5 },
      { id: 'screening', value: 3 },
      { id: 'submission', value: 2 },
      { id: 'interview', value: 1 },
      { id: 'hired', value: 1 },
    ],
  },
  {
    id: 'job2',
    title: 'Product Manager',
    statusDetails: [
      { id: 'application', value: 4 },
      { id: 'screening', value: 2 },
      { id: 'submission', value: 1 },
      { id: 'interview', value: 1 },
      { id: 'hired', value: 0 },
    ],
  },
  {
    id: 'job3',
    title: 'UX Designer',
    statusDetails: [
      { id: 'application', value: 3 },
      { id: 'screening', value: 2 },
      { id: 'submission', value: 1 },
      { id: 'interview', value: 0 },
      { id: 'hired', value: 0 },
    ],
  },
  {
    id: 'job4',
    title: 'Data Scientist',
    statusDetails: [
      { id: 'application', value: 6 },
      { id: 'screening', value: 4 },
      { id: 'submission', value: 3 },
      { id: 'interview', value: 2 },
      { id: 'hired', value: 1 },
    ],
  },
  {
    id: 'job5',
    title: 'DevOps Engineer',
    statusDetails: [
      { id: 'application', value: 5 },
      { id: 'screening', value: 3 },
      { id: 'submission', value: 2 },
      { id: 'interview', value: 1 },
      { id: 'hired', value: 1 },
    ],
  },
  {
    id: 'job6',
    title: 'Marketing Specialist',
    statusDetails: [
      { id: 'application', value: 7 },
      { id: 'screening', value: 5 },
      { id: 'submission', value: 4 },
      { id: 'interview', value: 2 },
      { id: 'hired', value: 2 },
    ],
  },
  {
    id: 'job7',
    title: 'Sales Executive',
    statusDetails: [
      { id: 'application', value: 8 },
      { id: 'screening', value: 6 },
      { id: 'submission', value: 5 },
      { id: 'interview', value: 3 },
      { id: 'hired', value: 2 },
    ],
  },
  {
    id: 'job8',
    title: 'Graphic Designer',
    statusDetails: [
      { id: 'application', value: 4 },
      { id: 'screening', value: 3 },
      { id: 'submission', value: 2 },
      { id: 'interview', value: 1 },
      { id: 'hired', value: 0 },
    ],
  },
  {
    id: 'job9',
    title: 'Content Writer',
    statusDetails: [
      { id: 'application', value: 5 },
      { id: 'screening', value: 4 },
      { id: 'submission', value: 3 },
      { id: 'interview', value: 2 },
      { id: 'hired', value: 1 },
    ],
  },
  {
    id: 'job10',
    title: 'System Administrator',
    statusDetails: [
      { id: 'application', value: 6 },
      { id: 'screening', value: 5 },
      { id: 'submission', value: 4 },
      { id: 'interview', value: 3 },
      { id: 'hired', value: 2 },
    ],
  },
];

const Dashboard = () => {
  return (
    <Flex css={{
      width: '100vw',
      height: '100%',
      backgroundColor: '$secondary50',
      padding: '$12',
      'p': {
        marginBottom: 0,
      },
      overflowY: 'auto',

    }}>
      <Flex css={{
        height: '100%',
        flexDirection: 'column',
        overflowY: 'auto',
        gap: '$4',
        width: '100%',
      }}>
        <IntroMap data={dummyData} />
        <Barchart data={dummyData} />
      </Flex>
    </Flex>
  );
};

export default Dashboard;