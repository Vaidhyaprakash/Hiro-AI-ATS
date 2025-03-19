import { Avatar, Box, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Flex, Text, Tooltip } from '@sparrowengg/twigs-react'
import React from 'react'
import logo02 from '../../assets/logo02.png'
import { BellIcon, EmailIcon, HomeIcon, SettingsIcon, UsersIcon, WrenchIcon } from '@sparrowengg/twigs-react-icons'
import { useNavigate } from 'react-router-dom'
const navigationItems = [
  {
    label: 'Home',
    href: '/admin/dashboard',
    id: 'dashboard',
    icon: <HomeIcon size={20} />
  },
  {
    label: 'Jobs',
    href: '/admin/jobs',
    id: 'jobs',
    icon: <WrenchIcon size={20} />
  },
  {
    label: 'Candidates',
    href: '/admin/candidates',
    id: 'candidates',
    icon: <UsersIcon size={20} />
  },
  {
    label: 'Exams',
    href: '/exam/session',
    id: 'examsession',
    icon: <UsersIcon size={20} />
  }
]
const settingsItems = [
  {
    tooltipContent: 'Email',
    href: '/admin/email',
    id: 'email',
    label: 'Email',
    disabled: true,
    icon: <EmailIcon size={20} />
  },
  {
    tooltipContent: 'Alerts',
    href: '/admin/alerts',
    id: 'alerts',
    label: 'Alerts',
    disabled: true,
    icon: <BellIcon size={20} />
  },
  {
    tooltipContent: 'Settings',
    href: '/admin/settings',
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon size={20} />
  }

]
const AvatarDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        css={{
          cursor: 'pointer',
          backgroundColor: 'transparent',
          border: 'none',
          '&:focus, &:hover': {
            outline: 'none',
            boxShadow: 'none'
          },
        }}
      >
        <Avatar
          src="https://randomuser.me/api/portraits/men/35.jpg"
          name="John Doe"
          size="lg"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
const NavbarRightSettings = () => {
  return (
    <Flex gap="$4" alignItems="center">
      {settingsItems.map((item) => (
        <Tooltip key={item.id} content={item.tooltipContent}>
          <Flex css={{
            cursor: 'pointer',
            '&:hover': {
              color: '$secondary100'
            },
            ...(item.disabled ? {
              color: '$secondary50',
              cursor: 'not-allowed'
            } : {
              color: '$secondary100'
            })
          }}>
            {item.icon}
          </Flex>
        </Tooltip>
      ))}
    </Flex>
  )
}
const NavbarLeft = ({ activePage }) => {
  const navigate = useNavigate()
  console.log(activePage)
  return (
    <>
      <Flex css={{
        width: '$12',
        height: '$12',
        marginRight: '$8',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img src={logo02} alt="logo" style={{ width: '36px', height: '36px' }} />
      </Flex>
      <Flex gap="$8" css={{
        fontWeight: '700',
        fontSize: '$md',
        'p': {
          fontSize: '$md',
          fontWeight: '700',
          color: '$secondary100'
        }
      }}>
        {navigationItems.map((item) => (
          <Flex key={item.id} gap="$3" alignItems="center"
            onClick={() => {
              navigate(item.href)
            }}
            css={{
              cursor: 'pointer',
              height: '100%',
              '&:hover': {
                color: '$secondary100'
              },
              ...(activePage === item.id ? {
                borderBottom: '2px solid $secondary100'
              } : {})
            }}>
            {item.icon}
            <Text>
              {item.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </>
  )
}


function Navbar() {
  // How to get active page using website url
  const pathname = window.location.pathname;
  const activePage = pathname.split('/').pop();
  return (
    <Flex css={{
      height: '$15',
      width: '100%',
      backgroundColor: '#2d5491',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: 'white',
      flexDirection: 'row',
      padding: '0 $12',
      'p': {
        marginBottom: '0px'
      },
      '*': {
        fontFamily: 'DM Sans'
      }
    }}>
      <Flex>
        <NavbarLeft activePage={activePage} />
      </Flex>
      <Flex gap="$8">
        <NavbarRightSettings />
        <AvatarDropdown />
      </Flex>
    </Flex>
  )
}

export default Navbar