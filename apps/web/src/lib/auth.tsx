import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {api,json,type User} from './api';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
type AuthContextType={user:User|null;loading:boolean;login:(email:string,password:string)=>Promise<void>;register:(data:{full_name:string;email:string;password:string;phone?:string})=>Promise<void>;logout:()=>Promise<void>;updateUser:(user:User)=>void;selectOrganization:(id:number)=>Promise<void>};
const AuthContext=createContext<AuthContextType|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);const queryClient=useQueryClient(),navigate=useNavigate();
 useEffect(()=>{let active=true;api<{user:User}>('/auth/me').then(data=>{if(active)setUser(data.user);}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 const login=async(email:string,password:string)=>{const data=await api<{user:User}>('/auth/login',json('POST',{email,password}));setUser(data.user);queryClient.clear();navigate(data.user.role==='customer'?'/overview':data.user.role==='staff'?'/staff/dashboard':'/admin/dashboard');};
 const register=async(data:{full_name:string;email:string;password:string;phone?:string})=>{const result=await api<{user:User}>('/auth/register',json('POST',data));setUser(result.user);queryClient.clear();navigate('/overview');};
 const selectOrganization=async(id:number)=>{const data=await api<{user:User}>('/auth/select-organization',json('POST',{organization_id:id}));setUser(data.user);queryClient.clear();navigate(data.user.role==='customer'?'/overview':data.user.role==='staff'?'/staff/dashboard':'/admin/dashboard');};
 const logout=async()=>{await api('/auth/logout',json('POST'));setUser(null);queryClient.clear();navigate('/login');};
 return <AuthContext.Provider value={{user,loading,login,register,logout,updateUser:(next)=>{setUser(next);queryClient.clear();},selectOrganization}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw Error('AuthProvider missing');return ctx;}
