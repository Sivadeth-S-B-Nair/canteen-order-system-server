const axios=require("axios")

const OPENCAGE_BASE="https://api.opencagedata.com/geocode/v1/json"

const geocodeAddress=async(addressText)=>{
    const apiKey=process.env.OPENCAGE_API_KEY

    if(!apiKey){
        console.warn("[Geocoding] OPENCAGE_API_KEY not set - skip geocoding")
        return null
    }
    if(!addressText|| addressText.trim().length<5){
        return null
    }
    try{
        const {data}=await axios.get(OPENCAGE_BASE,{
            params:{
                q:addressText.trim(),
                key:apiKey,
                limit:1,
                no_annotations:1,
                language:"en"
            },
            timeout:5000 // don't block the request for more than 5 s
        })
        if(data.results&&data.results.length>0){
            const {lat,lng}=data.results[0].geometry
            return {latitude:lat,longitude:lng}
        }
        console.warn(`[Geocoding] No results for: ${addressText}`)
        return null
    }
    catch(err){
        console.error("[Geocoding] API error:",err.response?.data?.status?.message??err.message)
        return null
    }
}

const buildAddressString=({addressLine,city,state,pincode}={})=>{
    return [addressLine,city,state,pincode].filter(Boolean).join(", ")
}

module.exports={geocodeAddress,buildAddressString}