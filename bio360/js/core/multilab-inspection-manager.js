export class MultiLabInspectionManager{
  constructor({storage,events,multilab}){
    this.storage=storage;
    this.events=events;
    this.multilab=multilab;
    this.key="multilab.inspectionSessionId";
  }

  sessionId(){
    const id=this.storage.get(this.key,null);
    return id && this.multilab.getSession(id)?id:null;
  }

  session(){
    const id=this.sessionId();
    return id?this.multilab.getSession(id):null;
  }

  set(sessionId){
    if(sessionId && !this.multilab.getSession(sessionId)){
      throw new Error("Sessão para inspeção não encontrada.");
    }

    if(sessionId)this.storage.set(this.key,sessionId);
    else this.storage.remove(this.key);

    const session=sessionId?this.multilab.getSession(sessionId):null;
    this.events.emit("multilab:inspection-changed",{sessionId,session});
    return session;
  }

  clear(){
    return this.set(null);
  }

  selectedOrActive(){
    return this.session()||this.multilab.activeSession()||null;
  }

  isHistorical(sessionId=this.sessionId()){
    if(!sessionId)return false;
    return sessionId!==this.multilab.activeSessionId();
  }
}
