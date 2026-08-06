(function () {
    "use strict";

    const DEFAULT_ORGANIZATION_ID = "cms9eoh7c0000prxue4fvntqp";
    function api() {
        if (!window.HarmoniaApi) throw new Error("Harmonia API is unavailable.");
        return window.HarmoniaApi;
    }
    function organizationId() {
        return api().getOrganizationId() || DEFAULT_ORGANIZATION_ID;
    }
    function notify(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }

    let items=[];let loadingPromise=null;
    function normalize(x){return { ...x, type:String(x.sector||'other').toLowerCase(), status:x.status||'active', contactName:x.contactName||'', contactEmail:x.email||'', location:x.address||'', nextStep:x.nextStep||'', followUpDate:x.followUpDate||'', notes:x.description||'' };}
    function payload(data){return {name:data.name,description:[data.notes,data.nextStep?`Next step: ${data.nextStep}`:'',data.followUpDate?`Follow-up: ${data.followUpDate}`:''].filter(Boolean).join('\n'),website:data.website||undefined,email:data.contactEmail||undefined,phone:data.phone||undefined,sector:data.type||'other',address:data.location||undefined,organizationId:organizationId()};}
    async function load(options={}){if(loadingPromise&&!options.force)return loadingPromise;loadingPromise=(async()=>{const r=await api().request(`/external-organizations?organizationId=${encodeURIComponent(organizationId())}`);items=(r||[]).map(normalize);notify('harmonia:partners-updated',{items});return items;})();try{return await loadingPromise;}finally{loadingPromise=null;}}
    function getAll(){return [...items];}function getById(id){return items.find(x=>String(x.id)===String(id))||null;}
    async function create(data){const x=normalize(await api().request('/external-organizations',{method:'POST',body:JSON.stringify(payload(data))}));items.unshift(x);notify('harmonia:partners-updated',{created:x});return x;}
    async function update(id,data){const x=normalize(await api().request(`/external-organizations/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(payload(data))}));items=items.map(y=>String(y.id)===String(id)?x:y);notify('harmonia:partners-updated',{updated:x});return x;}
    async function remove(id){await api().request(`/external-organizations/${encodeURIComponent(id)}`,{method:'DELETE'});items=items.filter(x=>String(x.id)!==String(id));notify('harmonia:partners-updated',{deletedId:id});return true;}
    window.HarmoniaPartners={load,getAll,getById,create,update,delete:remove};
    console.log('✅ Railway Partners Manager Loaded');
})();
