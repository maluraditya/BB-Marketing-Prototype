"use client";
import {useState} from "react";
import CommerceApp from "./commerce";
import {RetailWorkspace,RomiWorkspace} from "./workspaces";
import {Tabs,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {Toaster} from "@/components/ui/sonner";

export default function Page(){
  const [workspace,setWorkspace]=useState("commerce");
  const switchTo=(which:string)=>{setWorkspace(which);window.scrollTo(0,0)};
  return <><div className="workspace-switch no-print"><div className="workspace-switch-inner"><span className="workspace-wordmark">BLACKBERRYS</span><Tabs value={workspace} onValueChange={switchTo}><TabsList><TabsTrigger value="commerce">Commerce OS</TabsTrigger><TabsTrigger value="retail">Retail Marketing OS</TabsTrigger><TabsTrigger value="romi">ROMI Dashboard</TabsTrigger></TabsList></Tabs><span className="workspace-demo">SOW review · synthetic data</span></div></div>{workspace==="commerce"?<CommerceApp/>:workspace==="retail"?<RetailWorkspace onSwitch={switchTo}/>:<RomiWorkspace onSwitch={switchTo}/>}<Toaster position="bottom-center" richColors/></>
}
