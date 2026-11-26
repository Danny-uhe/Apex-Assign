import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className='min-h-screen grid lg:grid-cols-2'>
      {/* Left Side */}
      <div className='hidden lg:flex items-center justify-center border-r border-zinc-800 bg-zinc-900 text-white'>
        <h1 className='text-5xl font-bold'>ApexAssign</h1>
      </div>

      {/* Right Side */}
      <div className='flex items-center justify-center p-8'>
        <Outlet />
      </div>
    </div>
  );
}
