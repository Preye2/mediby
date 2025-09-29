import React from 'react'
import AddNewSessionDialog from './_components/AddNewSessionDialog'
import UserHistory from './_components/UserHistory'

export default function Dashboard() {
  return (
    <div>
      <div className='flex items-center justify-between mb-10'>
{/*         <h2>My Dashboard</h2> */}
       <AddNewSessionDialog/>
      </div>
      <UserHistory />

      </div>
  )
}
