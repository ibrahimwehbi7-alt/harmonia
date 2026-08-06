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

    const LINK_KEY='harmonia.file-links';
    let uploads=[];
    let loadingPromise=null;
    function localLinks(){try{return JSON.parse(localStorage.getItem(LINK_KEY)||'[]');}catch{return [];}}
    function saveLinks(items){localStorage.setItem(LINK_KEY,JSON.stringify(items));}
    function normalize(x){return {...x,title:x.title||x.originalName||'Untitled file',sourceType:x.sourceType||'upload',sizeBytes:x.sizeBytes??x.size??0,projectId:x.projectId||null,category:x.category||categoryFromMime(x.mimeType)};}
    function categoryFromMime(mime=''){if(mime.startsWith('image/'))return'image';if(mime.includes('pdf')||mime.includes('word')||mime.startsWith('text/'))return'document';if(mime.includes('sheet')||mime.includes('excel'))return'spreadsheet';if(mime.includes('presentation')||mime.includes('powerpoint'))return'presentation';if(mime.startsWith('video/'))return'video';if(mime.startsWith('audio/'))return'audio';return'other';}
    async function load(options={}){if(loadingPromise&&!options.force)return loadingPromise;loadingPromise=(async()=>{const r=await api().request(`/files?organizationId=${encodeURIComponent(organizationId())}&page=1&limit=100`);uploads=(r?.items||r||[]).map(normalize);notify('harmonia:files-updated');return getAll();})();try{return await loadingPromise;}finally{loadingPromise=null;}}
    function getAll(){return [...uploads,...localLinks().map(normalize)].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));}
    function getById(id){return getAll().find(x=>String(x.id)===String(id))||null;}
    function getByProjectId(id){return getAll().filter(x=>String(x.projectId)===String(id));}
    function resolveUrl(file){file=typeof file==='string'?getById(file):file;if(!file)return'';if(file.sourceType==='link')return file.url||'';return `${api().getBaseUrl()}/files/${encodeURIComponent(file.id)}/download`;}
    async function add(data){
        if(data.sourceType==='link'){
            const now=new Date().toISOString();const x=normalize({...data,id:`link-${crypto.randomUUID?.()||Date.now()}`,createdAt:now,updatedAt:now});const links=localLinks();links.unshift(x);saveLinks(links);notify('harmonia:files-updated',{created:x});return x;
        }
        const file=data.file||data.uploadFile||data.rawFile;
        if(!(file instanceof File)) throw new Error('Select a file to upload.');
        const form=new FormData();form.append('file',file);
        const q=new URLSearchParams({organizationId:organizationId()});if(data.projectId)q.set('projectId',data.projectId);
        const x=normalize(await api().request(`/files?${q}`,{method:'POST',body:form}));uploads.unshift(x);notify('harmonia:files-updated',{created:x});return x;
    }
    async function update(id,data){
        const existing=getById(id);if(!existing)return null;
        if(existing.sourceType!=='link') throw new Error('Uploaded file metadata editing is not available in Version 1. Delete and re-upload the file.');
        const links=localLinks().map(x=>String(x.id)===String(id)?normalize({...x,...data,id:x.id,createdAt:x.createdAt,updatedAt:new Date().toISOString()}):x);saveLinks(links);const updated=links.find(x=>String(x.id)===String(id));notify('harmonia:files-updated',{updated});return updated;
    }
    async function remove(id){const existing=getById(id);if(!existing)return false;if(existing.sourceType==='link'){saveLinks(localLinks().filter(x=>String(x.id)!==String(id)));}else{await api().request(`/files/${encodeURIComponent(id)}`,{method:'DELETE'});uploads=uploads.filter(x=>String(x.id)!==String(id));}notify('harmonia:files-updated',{deletedId:id});return true;}
    window.HarmoniaFiles={load,getAll,getById,getByProjectId,getImages:()=>getAll().filter(x=>x.category==='image'),isImage:x=>normalize(x).category==='image',resolveUrl,add,update,delete:remove};
    console.log('✅ Railway Files Manager Loaded');
})();
