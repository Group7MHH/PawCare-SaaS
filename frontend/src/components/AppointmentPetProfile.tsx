import {useQuery} from '@tanstack/react-query';
import {PetAvatar} from './PetAvatar';
import {Loading,ErrorNotice} from './UI';
import {api,dateOnly,errorMessage,speciesName,type Pet,type CareRecord} from '../lib/api';

type PetProfileResponse={pet:Pet;records:CareRecord[]};

/** Read-only pet information in an authorized appointment detail. */
export function AppointmentPetProfile({petId,viewerId}:{petId:number;viewerId:number}){
 const profile=useQuery({
  queryKey:['appointment-pet-profile',viewerId,petId],
  queryFn:()=>api<PetProfileResponse>(`/pets/${petId}`),
  staleTime:0,
  refetchOnMount:'always'
 });
 return <section className="pc-appointment-pet" aria-label="Hồ sơ thú cưng">
  <h3>Hồ sơ thú cưng</h3>
  {profile.isLoading?<Loading/>:profile.error?<ErrorNotice message={errorMessage(profile.error)}/>:
   profile.data&&<>
    <div className="pc-appointment-pet-heading"><PetAvatar species={profile.data.pet.species} size={30}/><div><strong>{profile.data.pet.name}</strong><span>{profile.data.pet.breed||speciesName(profile.data.pet.species)}</span></div></div>
    <dl className="pc-appointment-pet-grid">
     <div><dt>Loài</dt><dd>{speciesName(profile.data.pet.species)}</dd></div>
     <div><dt>Giống</dt><dd>{profile.data.pet.breed||'—'}</dd></div>
     <div><dt>Giới tính</dt><dd>{profile.data.pet.gender==='male'?'Đực':profile.data.pet.gender==='female'?'Cái':'Chưa rõ'}</dd></div>
     <div><dt>Ngày sinh</dt><dd>{dateOnly(profile.data.pet.birthday)}</dd></div>
     <div><dt>Cân nặng</dt><dd>{profile.data.pet.weight_kg!=null?`${profile.data.pet.weight_kg} kg`:'—'}</dd></div>
     <div><dt>Màu lông</dt><dd>{profile.data.pet.color||'—'}</dd></div>
    </dl>
    <div className="pc-appointment-pet-notes"><strong>Lưu ý từ chủ thú cưng</strong><p>{profile.data.pet.notes||'Chưa có ghi chú.'}</p></div>
    <h4>Lịch sử chăm sóc ({profile.data.records.length})</h4>
    {profile.data.records.length===0?<p className="pc-appointment-pet-empty">Chưa có lịch sử chăm sóc.</p>:
    <div className="pc-appointment-pet-history">{profile.data.records.map(record=><article key={record.id}>
     <div className="pc-appointment-pet-record-head"><strong>{record.title}</strong><time>{dateOnly(record.care_date)}</time></div>
     {record.description&&<p>{record.description}</p>}
     {record.next_due_date&&<small>Ngày nhắc lại: {dateOnly(record.next_due_date)}</small>}
    </article>)}</div>}
   </>}
 </section>;
}
