import React,{useEffect,useState} from 'react';
import ReactDOM from 'react-dom/client';
import RadicalPrototype from './RadicalPrototype.jsx';
import MobilePrototype from './MobilePrototype.jsx';

function PreviewRoot(){
  const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width: 760px)').matches);
  useEffect(()=>{
    const mq=window.matchMedia('(max-width: 760px)');
    const onChange=e=>setMobile(e.matches);
    mq.addEventListener?.('change',onChange);
    return()=>mq.removeEventListener?.('change',onChange);
  },[]);
  return mobile?<MobilePrototype/>:<RadicalPrototype/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreviewRoot />
  </React.StrictMode>
);
