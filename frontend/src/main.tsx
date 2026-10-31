import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter,Navigate,Route,Routes,useLocation} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'react-hot-toast';
import {AuthProvider,useAuth} from './lib/auth';
import {Layout} from './components/Layout';
import {Loading} from './components/UI';
import {AuthPage} from './pages/AuthPage';
import {Overview} from './pages/Overview';
import {PetsPage,PetDetail} from './pages/Pets';
import {Booking} from './pages/Booking';
import {MyAppointments} from './pages/MyAppointments';
import {AdminDashboard} from './pages/AdminDashboard';
import {AdminAppointments} from './pages/AdminAppointments';
import {Customers} from './pages/Customers';
import {Catalog} from './pages/Catalog';
import {Profile} from './pages/Profile';
import {Team} from './pages/Team';
import {StaffDashboard} from './pages/StaffDashboard';
import {Invite} from './pages/Invite';
import './styles.css';
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:30_000,retry:1}}});
function Protected(){const {user,loading}=useAuth();const location=useLocation();if(loading)return <Loading/>;if(!user)return <Navigate to="/login" state={{from:location}} replace/>;return <Layout/>;}
function RolePage({children,admin=false}:{children:React.ReactNode;admin?:boolean}){const {user}=useAuth();return user&&(admin?user.role!=='customer':user.role==='customer')?<>{children}</>:<Navigate to={user?.role==='customer'?'/overview':'/admin/dashboard'} replace/>;}
function StaffOnly({children}:{children:React.ReactNode}){const {user}=useAuth();return user?.role==='staff'?<>{children}</>:<Navigate to="/" replace/>;}
function AdminOnly({children}:{children:React.ReactNode}){const {user}=useAuth();return user&&user.role==='admin'?<>{children}</>:<Navigate to="/" replace/>;}
function Home(){const {user,loading}=useAuth();if(loading)return <Loading/>;return <Navigate to={user?(user.role==='customer'?'/overview':'/admin/dashboard'):'/login'} replace/>;}
function AppRoutes(){return <Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="/invite/:token" element={<Invite/>}/><Route path="/" element={<Home/>}/><Route element={<Protected/>}><Route path="/overview" element={<RolePage><Overview/></RolePage>}/><Route path="/pets" element={<RolePage><PetsPage/></RolePage>}/><Route path="/pets/:id" element={<RolePage><PetDetail/></RolePage>}/><Route path="/book" element={<RolePage><Booking/></RolePage>}/><Route path="/my-appointments" element={<RolePage><MyAppointments/></RolePage>}/><Route path="/profile" element={<Profile/>}/><Route path="/admin/team" element={<AdminOnly><Team/></AdminOnly>}/><Route path="/staff/dashboard" element={<StaffOnly><StaffDashboard/></StaffOnly>}/><Route path="/staff/appointments" element={<StaffOnly><AdminAppointments/></StaffOnly>}/><Route path="/admin/dashboard" element={<AdminOnly><AdminDashboard/></AdminOnly>}/><Route path="/admin/appointments" element={<AdminOnly><AdminAppointments/></AdminOnly>}/><Route path="/admin/customers" element={<AdminOnly><Customers/></AdminOnly>}/><Route path="/admin/catalog" element={<AdminOnly><Catalog/></AdminOnly>}/></Route><Route path="*" element={<Home/>}/></Routes>;}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><AppRoutes/></AuthProvider></BrowserRouter><Toaster position="top-right" toastOptions={{duration:3500,style:{fontFamily:'Be Vietnam Pro,sans-serif',fontSize:13}}}/></QueryClientProvider></React.StrictMode>);
