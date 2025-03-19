import { Box, Flex } from '@sparrowengg/twigs-react';
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../../components/admin/Navbar';
function AdminLayout() {
  return (
    <Flex css={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      flexDirection: 'column',
      backgroundColor: '$secondary50',
    }}>
      <Navbar />
      <Box css={{
        width: '200px',
        height: '100%',
      }}>
        <Outlet />
      </Box>
    </Flex>
  );
}

export default AdminLayout; 