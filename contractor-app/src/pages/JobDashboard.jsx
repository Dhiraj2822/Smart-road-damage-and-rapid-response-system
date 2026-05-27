import React,{useEffect,useState} from 'react';

import {
Container,Typography,Box,Card,CardContent,CardActions,
Button,Tabs,Tab,Chip,Grid,AppBar,Toolbar,IconButton,Avatar,Paper
} from '@mui/material';

import {
Logout as LogoutIcon,
Assignment,
Build,
History,
LocationOn,
Event
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

import api from '../api/axios';


function JobCard({job}){

const navigate = useNavigate();

return(

<Card sx={{mb:2}}>

<CardContent>

<Typography fontWeight="bold">
{job.orderNumber}
</Typography>

<Typography sx={{mb:1}}>
{job.description}
</Typography>

<Box sx={{display:'flex',alignItems:'center',mb:1}}>
<Event sx={{mr:1,fontSize:18}}/>
<Typography variant="body2">
Due: {new Date(job.dueDate).toLocaleDateString()}
</Typography>
</Box>

<Box sx={{display:'flex',alignItems:'center'}}>
<LocationOn sx={{mr:1,fontSize:18}}/>
<Typography variant="body2">
{job.complaint?.address}
</Typography>
</Box>

</CardContent>

<CardActions>

<Button
variant="contained"
fullWidth
onClick={()=>navigate(`/jobs/${job.id}`)}
>

View Details

</Button>

</CardActions>

</Card>

)

}


export default function JobDashboard(){

const [jobs,setJobs] = useState([]);
const [tab,setTab] = useState(0);

const navigate = useNavigate();

const user = JSON.parse(localStorage.getItem("user"));

const companyName = user?.contractor?.companyName || "Contractor";


const fetchJobs = async ()=>{

try{

const res = await api.get('/contractors/my-orders');

setJobs(res.data.workOrders);

}catch(err){

console.error(err);

if(err.response?.status === 401){
navigate('/');
}

}

};

useEffect(()=>{
fetchJobs();
},[]);


const handleLogout = ()=>{
localStorage.clear();
navigate('/');
};


const filterJobs = (statusList)=>{
return jobs.filter(j => statusList.includes(j.status));
};


const displayedJobs =
tab === 0
? filterJobs(['ASSIGNED','PENDING'])
: tab === 1
? filterJobs(['IN_PROGRESS'])
: filterJobs(['COMPLETED','REJECTED','CLOSED']);


return(

<Box>

<AppBar position="static">

<Toolbar>

<Avatar sx={{mr:2}}>
<Build/>
</Avatar>

<Box sx={{flexGrow:1}}>

<Typography fontWeight="bold">
{companyName}
</Typography>

<Typography variant="caption">
Work Order Portal
</Typography>

</Box>

<IconButton color="inherit" onClick={handleLogout}>
<LogoutIcon/>
</IconButton>

</Toolbar>

</AppBar>


<Container sx={{mt:4}}>

<Paper sx={{mb:3}}>

<Tabs
value={tab}
onChange={(e,v)=>setTab(v)}
>

<Tab label="Assigned" icon={<Assignment/>}/>
<Tab label="In Progress" icon={<Build/>}/>
<Tab label="History" icon={<History/>}/>

</Tabs>

</Paper>


<Grid container spacing={3}>

{displayedJobs.map(job => (

<Grid item xs={12} md={4} key={job.id}>
<JobCard job={job}/>
</Grid>

))}

{displayedJobs.length === 0 && (

<Grid item xs={12}>

<Box sx={{textAlign:'center',py:6}}>

<Typography>
No Work Orders
</Typography>

</Box>

</Grid>

)}

</Grid>

</Container>

</Box>

)

}