package com.careflow.hospital.appointments;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.doctors.*;
import com.careflow.hospital.outbox.OutboxService;
import com.careflow.hospital.patients.*;
import com.careflow.hospital.reservations.*;
import com.careflow.hospital.shared.DomainException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {
  private final AppointmentRepository appointments; private final SlotReservationRepository reservations;
  private final PatientRepository patients; private final DoctorRepository doctors; private final AuditService audit; private final OutboxService outbox;
  public AppointmentService(AppointmentRepository a,SlotReservationRepository r,PatientRepository p,DoctorRepository d,AuditService audit,OutboxService outbox){appointments=a;reservations=r;patients=p;doctors=d;this.audit=audit;this.outbox=outbox;}

  @Transactional public AppointmentDtos.View book(UUID userId,AppointmentDtos.Book request){var patient=patient(userId);var reservation=reservation(request.reservationId(),patient.getId());reservation.consume();var appointment=appointments.save(new Appointment(patient.getId(),reservation.getDoctorId(),reservation.getId(),reservation.getStartsAt(),reservation.getEndsAt()));event(userId,"APPOINTMENT_BOOKED",appointment);return view(appointment);}
  @Transactional(readOnly=true) public List<AppointmentDtos.View> patientAppointments(UUID userId){return appointments.findAllByPatientIdOrderByStartsAtDesc(patient(userId).getId()).stream().map(this::view).toList();}
  @Transactional(readOnly=true) public List<AppointmentDtos.DoctorView> doctorAppointments(UUID userId){var doctor=doctors.findByUserId(userId).filter(Doctor::isActive).orElseThrow(()->notFound("DOCTOR_NOT_FOUND","Active doctor profile was not found."));return appointments.findAllByDoctorIdOrderByStartsAtDesc(doctor.getId()).stream().map(this::doctorView).toList();}
  @Transactional public AppointmentDtos.View cancel(UUID userId,UUID id,String reason){var a=ownedPatientAppointment(userId,id);try{a.cancel(reason);}catch(IllegalStateException e){throw conflict(e.getMessage());}event(userId,"APPOINTMENT_CANCELLED",a);return view(a);}
  @Transactional public AppointmentDtos.View reschedule(UUID userId,UUID id,UUID reservationId){var original=ownedPatientAppointment(userId,id);var r=reservation(reservationId,original.getPatientId());if(r.getDoctorId().equals(original.getDoctorId())&&r.getStartsAt().equals(original.getStartsAt()))throw conflict("The replacement slot must differ from the current appointment.");var replacement=new Appointment(original.getPatientId(),r.getDoctorId(),r.getId(),r.getStartsAt(),r.getEndsAt(),original.getId());r.consume();replacement=appointments.saveAndFlush(replacement);try{original.markRescheduled(replacement.getId());}catch(IllegalStateException e){throw conflict(e.getMessage());}audit.record(userId,"APPOINTMENT_RESCHEDULED_FROM","APPOINTMENT",original.getId(),"SUCCESS");event(userId,"APPOINTMENT_RESCHEDULED",replacement);return view(replacement);}
  @Transactional public AppointmentDtos.View transition(UUID userId,UUID id,String status){var doctor=doctors.findByUserId(userId).orElseThrow(()->notFound("DOCTOR_NOT_FOUND","Doctor profile was not found."));var a=appointments.findByIdForUpdate(id).filter(x->x.getDoctorId().equals(doctor.getId())).orElseThrow(()->notFound("APPOINTMENT_NOT_FOUND","Appointment was not found."));try{a.transition(status);}catch(IllegalStateException e){throw conflict(e.getMessage());}event(userId,"APPOINTMENT_"+status,a);return view(a);}
  private SlotReservation reservation(UUID id,UUID patientId){return reservations.findByIdForUpdate(id).filter(r->r.getPatientId().equals(patientId)).orElseThrow(()->notFound("RESERVATION_NOT_FOUND","Reservation was not found."));}
  private Appointment ownedPatientAppointment(UUID userId,UUID id){var patient=patient(userId);return appointments.findByIdForUpdate(id).filter(a->a.getPatientId().equals(patient.getId())).orElseThrow(()->notFound("APPOINTMENT_NOT_FOUND","Appointment was not found."));}
  private Patient patient(UUID userId){return patients.findByUserId(userId).orElseThrow(()->notFound("PATIENT_NOT_FOUND","Patient profile was not found."));}
  private void event(UUID actor,String type,Appointment a){audit.record(actor,type,"APPOINTMENT",a.getId(),"SUCCESS");outbox.record(type,"APPOINTMENT",a.getId(),view(a),type+":"+a.getId()+":"+a.getStatus());}
  private AppointmentDtos.View view(Appointment a){var doc=doctors.findById(a.getDoctorId()).orElse(null);String docName=doc!=null?doc.getFullName():"Doctor";String docSpec=doc!=null?doc.getSpecialization():"";return new AppointmentDtos.View(a.getId(),a.getAppointmentNumber(),a.getPatientId(),a.getDoctorId(),docName,docSpec,a.getStartsAt(),a.getEndsAt(),a.getStatus(),a.getCancellationReason(),a.getRescheduledFromAppointmentId(),a.getRescheduledToAppointmentId());}
  private AppointmentDtos.DoctorView doctorView(Appointment a){var p=patients.findById(a.getPatientId()).orElseThrow(()->notFound("PATIENT_NOT_FOUND","Patient profile was not found."));return new AppointmentDtos.DoctorView(a.getId(),a.getAppointmentNumber(),p.getId(),p.getPatientNumber(),p.getFullName(),p.getPhone(),p.getDateOfBirth(),p.getGender(),p.getBloodGroup(),p.getAllergies(),p.getMedicalConditions(),a.getStartsAt(),a.getEndsAt(),a.getStatus());}
  private DomainException notFound(String code,String message){return new DomainException(HttpStatus.NOT_FOUND,code,message);} private DomainException conflict(String message){return new DomainException(HttpStatus.CONFLICT,"INVALID_APPOINTMENT_STATE",message);}
}
