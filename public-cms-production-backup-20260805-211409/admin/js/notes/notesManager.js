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

    let items = [];
    let loadingPromise = null;
    function normalize(note) { return { ...note, projectId: note.projectId || null, tags: Array.isArray(note.tags)?note.tags:[] }; }
    function payload(data) {
        return {
            title: data.title,
            content: data.content || "",
            category: data.category || "general",
            pinned: Boolean(data.pinned),
            tags: Array.isArray(data.tags) ? data.tags : [],
            organizationId: organizationId(),
            projectId: data.projectId || undefined
        };
    }
    async function load(options={}) {
        if (loadingPromise && !options.force) return loadingPromise;
        loadingPromise=(async()=>{
            const result=await api().request(`/notes?organizationId=${encodeURIComponent(organizationId())}&page=1&limit=100`);
            items=(result?.items||result||[]).map(normalize);
            notify('harmonia:notes-updated',{items}); return items;
        })();
        try{return await loadingPromise;}finally{loadingPromise=null;}
    }
    function getAll(){return [...items];}
    function getById(id){return items.find(x=>String(x.id)===String(id))||null;}
    function getByProjectId(id){return items.filter(x=>String(x.projectId)===String(id));}
    async function add(data){const x=normalize(await api().request('/notes',{method:'POST',body:JSON.stringify(payload(data))}));items.unshift(x);notify('harmonia:notes-updated',{created:x});return x;}
    async function update(id,data){const x=normalize(await api().request(`/notes/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(payload(data))}));items=items.map(y=>String(y.id)===String(id)?x:y);notify('harmonia:notes-updated',{updated:x});return x;}
    async function remove(id){await api().request(`/notes/${encodeURIComponent(id)}`,{method:'DELETE'});items=items.filter(x=>String(x.id)!==String(id));notify('harmonia:notes-updated',{deletedId:id});return true;}
    window.HarmoniaNotes={load,getAll,getById,getByProjectId,add,update,delete:remove};
    console.log('✅ Railway Notes Manager Loaded');
})();
