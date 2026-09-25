package com.careflow.hospital.identity;
import com.careflow.hospital.patients.*; import com.careflow.hospital.shared.DomainException; import java.time.*; import java.time.temporal.ChronoUnit; import java.util.*; import org.springframework.http.HttpStatus; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service
public class AuthService {
 private final AppUserRepository users;private final PatientRepository patients;private final RefreshSessionRepository sessions;private final PasswordEncoder passwords;private final TokenService tokens;
 public AuthService(AppUserRepository u,PatientRepository p,RefreshSessionRepository s,PasswordEncoder pe,TokenService t){users=u;patients=p;sessions=s;passwords=pe;tokens=t;}
 @Transactional public AuthDtos.Tokens register(AuthDtos.Register request){
   String input=request.email().strip().toLowerCase(Locale.ROOT);
   String digits=input.replaceAll("[^0-9]","");
   String email; String phone=null;
   if(!input.contains("@")){
     email=(digits.isEmpty()?input:digits)+"@phone.careflow.com";
     phone=input;
   }else{
     email=input;
   }
   boolean emailExists=users.existsByEmailIgnoreCase(email)||users.existsByEmailIgnoreCase(input)||(!digits.isEmpty()&&users.existsByEmailIgnoreCase(digits+"@phone.careflow.com"));
   boolean phoneExists=!digits.isEmpty()&&patients.findAll().stream().anyMatch(p->p.getPhone()!=null&&!p.getPhone().isBlank()&&p.getPhone().replaceAll("[^0-9]","").equals(digits));
   if(emailExists||phoneExists)throw new DomainException(HttpStatus.CONFLICT,"EMAIL_ALREADY_REGISTERED","An account with this email or phone number is already registered. Please sign in or use a different email/phone number.");
   AppUser user=users.save(new AppUser(UUID.randomUUID(),email,passwords.encode(request.password())));
   String number="PAT-"+user.getId().toString().substring(0,8).toUpperCase(Locale.ROOT);
   Patient patient=new Patient(UUID.randomUUID(),user.getId(),number,request.fullName().strip());
   if(phone!=null){patient.updateProfile(request.fullName().strip(),null,phone,null,null,null,null,null,null,null);}
   patients.save(patient);
   return issue(user);
 }
 @Transactional public AuthDtos.Tokens login(AuthDtos.Login request){
   String input=request.email().strip().toLowerCase(Locale.ROOT);
   String digits=input.replaceAll("[^0-9]","");
   AppUser user=users.findByEmailIgnoreCase(input)
       .or(()->!digits.isEmpty()?users.findByEmailIgnoreCase(digits+"@phone.careflow.com"):Optional.empty())
       .or(()->!digits.isEmpty()?users.findByEmailIgnoreCase(digits+"@careflow.local"):Optional.empty())
       .or(()->patients.findAll().stream()
           .filter(p->p.getPhone()!=null&&!p.getPhone().isBlank()&&p.getPhone().replaceAll("[^0-9]","").equals(digits))
           .findFirst()
           .flatMap(p->users.findById(p.getUserId())))
       .orElseThrow(this::invalid);
   if(!"ACTIVE".equals(user.getStatus())||!passwords.matches(request.password(),user.getPasswordHash()))throw invalid();
   return issue(user);
 }
 @Transactional public AuthDtos.Tokens refresh(String raw){RefreshSession old=sessions.findByTokenHash(tokens.hash(raw)).filter(RefreshSession::active).orElseThrow(this::invalidRefresh);old.revoke();AppUser user=users.findById(old.getUserId()).filter(u->"ACTIVE".equals(u.getStatus())).orElseThrow(this::invalidRefresh);return issue(user);}
 @Transactional public void logout(String raw){sessions.findByTokenHash(tokens.hash(raw)).ifPresent(RefreshSession::revoke);}
 @Transactional(readOnly=true) public AuthDtos.Me me(UUID userId){var user=users.findById(userId).orElseThrow(this::invalid);return new AuthDtos.Me(user.getId().toString(),user.getEmail(),user.getRoles());}
 private AuthDtos.Tokens issue(AppUser user){String refresh=tokens.opaqueRefresh();sessions.save(new RefreshSession(UUID.randomUUID(),user.getId(),tokens.hash(refresh),Instant.now().plus(30,ChronoUnit.DAYS)));return new AuthDtos.Tokens(tokens.access(user),refresh,900,"Bearer");}
 private DomainException invalid(){return new DomainException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS","Email, phone number, or password is incorrect.");} private DomainException invalidRefresh(){return new DomainException(HttpStatus.UNAUTHORIZED,"INVALID_REFRESH_TOKEN","The refresh session is invalid or expired.");}
}
