(function () {
  "use strict";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const api = (path, options) => window.HarmoniaApi.request(path, options);
  const orgId = () => window.HarmoniaApi.getOrganizationId();
  async function load() {
    const root = document.getElementById("workforceRoot"); if (!root) return;
    root.innerHTML = '<p class="empty-state">Loading people and work…</p>';
    try {
      const [me, departments, skills, assignments] = await Promise.all([
        api('/workforce/me'), api(`/workforce/departments?organizationId=${encodeURIComponent(orgId())}`), api(`/workforce/skills?organizationId=${encodeURIComponent(orgId())}`), api(`/workforce/assignments?organizationId=${encodeURIComponent(orgId())}`)
      ]);
      const role = window.HarmoniaRoleExperience?.getRole?.() || 'VIEWER';
      root.innerHTML = `
        <div class="workforce-summary">
          <article><span>Departments</span><strong>${departments.length}</strong></article>
          <article><span>Skills</span><strong>${me.userSkills?.length || 0}</strong></article>
          <article><span>Assignments</span><strong>${assignments.length}</strong></article>
          <article><span>Hours logged</span><strong>${(me.volunteerHours || []).reduce((s,h)=>s+Number(h.hours||0),0).toFixed(1)}</strong></article>
        </div>
        <div class="workforce-grid">
          <section class="workforce-panel"><p class="eyebrow">My profile</p><h3>Skills & interests</h3><form id="skillsForm">${skills.map(skill => { const saved=(me.userSkills||[]).find(x=>x.skillId===skill.id); return `<label class="skill-row"><input type="checkbox" name="skill" value="${skill.id}" ${saved?'checked':''}><span>${esc(skill.name)}</span><select data-level="${skill.id}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${saved?.proficiency===n?'selected':''}>${n}</option>`).join('')}</select></label>`; }).join('') || '<p>No skills created yet.</p>'}<button class="primary-button" type="submit">Save skills</button></form></section>
          <section class="workforce-panel"><p class="eyebrow">My commitments</p><h3>Assignments</h3><div>${assignments.map(a=>`<article class="assignment-card"><strong>${esc(a.title)}</strong><p>${esc(a.description||'')}</p><span>${esc(a.status)}</span>${a.userId===me.id && a.status==='OFFERED'?`<div><button data-respond="ACCEPTED" data-id="${a.id}">Accept</button><button data-respond="DECLINED" data-id="${a.id}">Decline</button></div>`:''}</article>`).join('') || '<p>No assignments yet.</p>'}</div></section>
          <section class="workforce-panel"><p class="eyebrow">Organization</p><h3>Departments</h3><div>${departments.map(d=>`<article class="department-card"><strong>${esc(d.name)}</strong><span>${d._count?.members||0} people</span><p>${esc(d.description||'')}</p></article>`).join('') || '<p>No departments yet.</p>'}</div></section>
          <section class="workforce-panel"><p class="eyebrow">Contribution</p><h3>Log volunteer hours</h3><form id="hoursForm"><label>Date<input name="date" type="date" required></label><label>Hours<input name="hours" type="number" min="0.25" step="0.25" required></label><label>Note<input name="note" type="text"></label><button class="primary-button" type="submit">Submit hours</button></form></section>
        </div>
        ${['ADMIN','SUPER_ADMIN'].includes(role)?`<section class="workforce-panel workforce-admin"><p class="eyebrow">Manager tools</p><h3>Build the team</h3><div class="manager-actions"><button id="newDepartment" class="secondary-button">New department</button><button id="newSkill" class="secondary-button">New skill</button>${role==='SUPER_ADMIN'?'<button id="newInvite" class="secondary-button">Create invitation code</button>':''}</div><div id="workforceManagerResult"></div></section>`:''}`;
      bind(me, skills);
    } catch (error) { root.innerHTML = `<p class="error-state">${esc(error.message || 'Could not load workforce.')}</p>`; }
  }
  function bind(me, skills) {
    document.getElementById('skillsForm')?.addEventListener('submit', async e => { e.preventDefault(); const selected=[...e.currentTarget.querySelectorAll('input[name=skill]:checked')].map(input=>({skillId:input.value,proficiency:Number(e.currentTarget.querySelector(`[data-level="${input.value}"]`).value),isInterested:true})); await api('/workforce/me/skills',{method:'PATCH',body:JSON.stringify({skills:selected})}); load(); });
    document.getElementById('hoursForm')?.addEventListener('submit', async e => { e.preventDefault(); const f=new FormData(e.currentTarget); await api('/workforce/hours',{method:'POST',body:JSON.stringify({date:f.get('date'),hours:Number(f.get('hours')),note:f.get('note')})}); load(); });
    document.querySelectorAll('[data-respond]').forEach(b=>b.addEventListener('click',async()=>{await api(`/workforce/assignments/${b.dataset.id}/respond`,{method:'PATCH',body:JSON.stringify({status:b.dataset.respond})});load();}));
    document.getElementById('newDepartment')?.addEventListener('click',async()=>{const name=prompt('Department name');if(!name)return;await api('/workforce/departments',{method:'POST',body:JSON.stringify({organizationId:orgId(),name})});load();});
    document.getElementById('newSkill')?.addEventListener('click',async()=>{const name=prompt('Skill name');if(!name)return;await api('/workforce/skills',{method:'POST',body:JSON.stringify({organizationId:orgId(),name})});load();});
    document.getElementById('newInvite')?.addEventListener('click',async()=>{const memberType=prompt('Invitation type (VOLUNTEER, INTERN, PARTNER)');if(!memberType)return;const invite=await api('/workforce/invitations',{method:'POST',body:JSON.stringify({organizationId:orgId(),memberType})});document.getElementById('workforceManagerResult').innerHTML=`<p>Invitation code: <strong>${esc(invite.code)}</strong></p>`;});
  }
  window.renderWorkforcePage = load;
  console.log('✅ Workforce Page Loaded');
})();
