(() => {
  const qs=new URLSearchParams(location.search);
  const id=qs.get('program');
  if(qs.get('review')!=='1'||!id)return;
  (async()=>{
    try{
      const d=await eventApi(`/content?program=${encodeURIComponent(id)}`);
      state.programId=d.program?.id||id;
      state.programName=d.program?.name||id;
      state.programLocation=d.program?.location||'';
      state.programTeamCount=Number(d.program?.teamCount||10);
      state.teamNo=1;
      state.code='';
      window.MTH_PROGRAM=d.program||null;
      applyContent(d.content);
      applyConfig(d.config);
      document.title=`${state.programName} · Preview`;
      state.phase='briefing';
      briefing();
    }catch(e){
      console.error('Program preview',e);
      toast(e?.message||'Program preview nije dostupan.');
    }
  })();
})();
