package com.careflow.hospital.prescriptions;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "prescription_item")
public class PrescriptionItem {
    @Id
    @Column(name = "prescription_item_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "generic_name")
    private String genericName;

    @Column(nullable = false)
    private String dosage;

    private String route;

    @Column(nullable = false)
    private String frequency;

    @Column(nullable = false)
    private String duration;

    private String quantity;

    @Column(name = "food_instruction")
    private String foodInstruction;

    private String timing;

    @Column(name = "special_instructions", columnDefinition = "text")
    private String specialInstructions;

    protected PrescriptionItem() {}

    public PrescriptionItem(String medicineName, String genericName, String dosage, String route, String frequency, String duration, String quantity, String foodInstruction, String timing, String specialInstructions) {
        this.id = UUID.randomUUID();
        this.medicineName = medicineName;
        this.genericName = genericName;
        this.dosage = dosage;
        this.route = route;
        this.frequency = frequency;
        this.duration = duration;
        this.quantity = quantity;
        this.foodInstruction = foodInstruction;
        this.timing = timing;
        this.specialInstructions = specialInstructions;
    }

    void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public UUID getId() { return id; }
    public Prescription getPrescription() { return prescription; }
    public String getMedicineName() { return medicineName; }
    public String getGenericName() { return genericName; }
    public String getDosage() { return dosage; }
    public String getRoute() { return route; }
    public String getFrequency() { return frequency; }
    public String getDuration() { return duration; }
    public String getQuantity() { return quantity; }
    public String getFoodInstruction() { return foodInstruction; }
    public String getTiming() { return timing; }
    public String getSpecialInstructions() { return specialInstructions; }
}
