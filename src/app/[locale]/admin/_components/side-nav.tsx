'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import React, { useState } from 'react'

import {
  IconChevronDown,
  IconDevices,
  IconFolder,
  IconHelpCircle,
  IconHome,
  IconMail,
  IconSettings,
} from '@tabler/icons-react'

export type SideNavItem = {
  title: string
  path: string
  icon?: JSX.Element
  submenu?: boolean
  subMenuItems?: SideNavItem[]
}

export const SIDENAV_ITEMS: SideNavItem[] = [
  {
    title: 'Home',
    path: '/admin/',
    icon: <IconHome size={24} />,
  },
  {
    title: 'Projects',
    path: '/admin/projects',
    icon: <IconFolder size={24} />,
    submenu: true,
    subMenuItems: [
      { title: 'All', path: '/admin/projects' },
      { title: 'Web Design', path: '/admin/projects/web-design' },
      { title: 'Graphic Design', path: '/admin/projects/graphic-design' },
    ],
  },
  {
    title: 'Devices',
    path: '/admin/device',
    icon: <IconDevices size={24} />,
  },
  {
    title: 'Brands',
    path: '/admin/brand',
    icon: <IconDevices size={24} />,
  },
  {
    title: 'Messages',
    path: '/admin/messages',
    icon: <IconMail size={24} />,
  },
  {
    title: 'Settings',
    path: '/admin/settings',
    icon: <IconSettings size={24} />,
    submenu: true,
    subMenuItems: [
      { title: 'Account', path: '/admin/settings/account' },
      { title: 'Privacy', path: '/admin/settings/privacy' },
    ],
  },
  {
    title: 'Help',
    path: '/admin/help',
    icon: <IconHelpCircle size={24} />,
  },
]

const SideNav = () => {
  return (
    <div className="fixed hidden h-screen flex-1 border-r border-zinc-200 bg-white md:flex md:w-60">
      <div className="flex w-full flex-col space-y-6">
        <Link
          href="/"
          className="flex h-12 w-full flex-row items-center justify-center space-x-3 border-b border-zinc-200 md:justify-start md:px-6"
        >
          <span className="h-7 w-7 rounded-lg bg-zinc-300" />
          <span className="hidden text-xl font-bold md:flex">Logo</span>
        </Link>

        <div className="flex flex-col space-y-2 md:px-6">
          {SIDENAV_ITEMS.map((item, idx) => {
            return <MenuItem key={idx} item={item} />
          })}
        </div>
      </div>
    </div>
  )
}

const MenuItem = ({ item }: { item: SideNavItem }) => {
  const pathname = usePathname()
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const toggleSubMenu = () => {
    setSubMenuOpen(!subMenuOpen)
  }

  return (
    <div className="">
      {item.submenu ? (
        <>
          <button
            onClick={toggleSubMenu}
            className={`flex w-full flex-row items-center justify-between rounded-lg p-2 hover:bg-zinc-100 ${
              pathname.includes(item.path) ? 'bg-zinc-100' : ''
            }`}
          >
            <div className="flex flex-row items-center space-x-4">
              {item.icon}
              <span className="flex text-xl font-semibold">{item.title}</span>
            </div>

            <div
              className={`${
                subMenuOpen ? 'rotate-180' : ''
              } flex transition-transform duration-200`}
            >
              <IconChevronDown size={24} />
            </div>
          </button>

          {subMenuOpen && (
            <div className="flex flex-col">
              {item.subMenuItems?.map((subItem, idx) => {
                return (
                  <Link
                    key={idx}
                    href={subItem.path}
                    className={`py-2 pl-12 text-lg hover:bg-zinc-100 ${
                      subItem.path === pathname ? 'font-bold text-black' : 'text-zinc-500'
                    }`}
                  >
                    <span>{subItem.title}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.path}
          className={`flex flex-row items-center space-x-4 rounded-lg p-2 hover:bg-zinc-100 ${
            item.path === pathname ? 'bg-zinc-100' : ''
          }`}
        >
          {item.icon}
          <span className="flex text-xl font-semibold">{item.title}</span>
        </Link>
      )}
    </div>
  )
}

export default SideNav
