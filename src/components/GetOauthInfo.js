import React from 'react';

var url = window.location.href;
var access_token = url.split("#")[1].split("=")[1].split("&")[0]; 
// get the userid 
var userId = url.split("#")[1].split("=")[2].split("&")[0]; 
const GetOauthInfo = () => (
// get the url 

//getting the access token from url 

console.log(access_token, userId))


export default GetOauthInfo