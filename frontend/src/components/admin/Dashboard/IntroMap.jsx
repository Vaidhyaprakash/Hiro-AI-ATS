import { Flex, Text } from "@sparrowengg/twigs-react";

const IntroMap = ({ data }) => {
  const introMapTitles = [
    {
      title: 'Application',
      id: 'application',
      color: '#56bfca'
    },
    {
      title: 'Screening',
      id: 'screening',
      color: '#c6cfe6'
    },
    {
      title: 'Submission',
      id: 'submission',
      color: '#bbd4f6'
    },
    {
      title: 'Interview',
      id: 'interview',
      color: '#edd3be'
    },
    {
      title: 'Hired',
      id: 'hired',
      color: '#d0d4de'
    },
  ]
  return (
    <Flex css={{
      backgroundColor: '$white900',
      borderRadius: '$md',
      flexDirection: 'column',
      gap: '$4',
      'p': {
        marginBottom: 0,
      },
      padding: '$12',
      width: '100vw',
      borderBottom: '1px solid $secondary100',
    }}>
      <Flex css={{
        justifyContent: 'space-between',
      }}>
        <Text css={{
          fontWeight: 'bold !important',
          fontSize: '$xl',
        }} weight="bold">
          Welcome Admin
        </Text>
        <Flex css={{
          gap: '$4'
        }}>
          <Button>
            <Text>
              Add Job
            </Text>
          </Button>
        </Flex>
      </Flex>
      <Flex css={{
        borderBottom: '1px solid $secondary100',
      }}>
        <Flex css={{
          flex: 2,
          padding: '$4',
          fontSize: '$md',
          borderTop: '1px solid $secondary100',
        }}>
          <Text css={{
            fontSize: '$md',
          }}>
            Job Title
          </Text>
        </Flex>
        {introMapTitles.map((item) => (
          <Flex key={item.id} css={{
            flex: 1,
            padding: '$4',
            borderTop: `2px solid ${item.color}`
          }}>
            <Text css={{
              fontSize: '$md',
            }}>{item.title}</Text>
          </Flex>
        ))}
      </Flex>
      <Flex css={{
        flexDirection: 'column',
        maxHeight: '240px',
        overflowY: 'auto',
      }}>
        {data.map((item) => (
          <Flex >
            <Flex key={item.id} css={{
              flex: 2,
              padding: '$4'
            }}>
              <Text>{item.title}</Text>
            </Flex>
            {item.statusDetails.map((status) => (
              <Flex key={status.id} css={{
                flex: 1,
                padding: '$4',
                backgroundColor: ''
              }}>
                <Text>{status.value}</Text>
              </Flex>
            ))}
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};

export default IntroMap;
