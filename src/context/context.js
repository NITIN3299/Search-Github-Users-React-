import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';
import { Children } from 'react';

const rootUrl = 'https://api.github.com';

const GithubContext=React.createContext();

const GithubProvider = ({children})=>{
    const [githubuser,setgithubuser]=useState(mockUser);
    const [repos,setrepos]=useState(mockRepos);
    const [followers,setfollowers]=useState(mockFollowers);
    // request loading
    const[requests,setrequests]=useState(0);
    const[loading,setloading]=useState(false);

    //error
    const[error,seterror]=useState({show:false,msg:""});
    // chaeck rate
    const checkrequests = ()=>{
        axios(`${rootUrl}/rate_limit`)
        .then(({data})=>{
            const {
                rate:{remaining}
            }=data;
            //console.log(data)
           // console.log(remaining); 
            setrequests(remaining)
            if(remaining==0){
                toggleerror(true,'sorry,you had exceeded your hourly searching limits')
            }
        })
        .catch((err)=>console.log(err));
    };
    const searchgithubuser = async(user)=>{
        // console.log(user);
        toggleerror();
        setloading(true);
        const resp = await axios(`${rootUrl}/users/${user}`).catch((err)=>console.log(err));
       // console.log(resp);
        if(resp){ 
            setgithubuser(resp.data);
            const {login,followers_url}=resp.data;
            //repos
            // axios(`${rootUrl}/users/${login}/repos?per_page=100`).
            // then((resp)=>setrepos(resp.data));

            // axios(`${followers_url}?per_page=100`).then((resp)=>setfollowers(resp.data))
            //for getting all data like repos,followers in one go....
            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`)
             ]).then((results)=>{
                 const[repos,followers]=results;
                 if(repos.status==='fulfilled'){
                     setrepos(repos.value.data);
                 }
                 if(followers.status==='fulfilled'){
                     setfollowers(followers.value.data);
                 }
             }).catch((err)=>console.log(err));
        }else{
            toggleerror(true,'there is no user with that username')
        }
        checkrequests();
        setloading(false);
    }
    function toggleerror(show=false,msg=''){
        seterror({show,msg});
    }
    useEffect(checkrequests,[]); 
    return (
       <GithubContext.Provider value={{
           githubuser,
           repos,
           followers,
           requests,
           error,
           searchgithubuser,
           loading
       }}>
        {children}
       </GithubContext.Provider>
    );
}

export {GithubContext,GithubProvider}