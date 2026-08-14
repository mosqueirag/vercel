import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"COOPSAR Servicios",description:"Gestioná tus servicios de COOPSAR de forma simple, rápida y segura."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
