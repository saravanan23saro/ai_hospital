package com.careflow.hospital.payments;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PaymentProviderRegistry {
    private final Map<String, PaymentProvider> providers;
    private final String defaultProviderName;

    public PaymentProviderRegistry(List<PaymentProvider> providerList, 
                                   @Value("${hospital.payments.provider:mock}") String defaultProviderName) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(
                    p -> p.getProviderName().toUpperCase(),
                    Function.identity(),
                    (existing, replacement) -> existing
                ));
        this.defaultProviderName = defaultProviderName.toUpperCase();
    }

    public PaymentProvider getProvider(String providerName) {
        if (providerName != null && !providerName.isBlank()) {
            PaymentProvider provider = providers.get(providerName.toUpperCase());
            if (provider != null) {
                return provider;
            }
        }
        PaymentProvider defaultProvider = providers.get(defaultProviderName);
        if (defaultProvider != null) {
            return defaultProvider;
        }
        return providers.values().iterator().next();
    }
}
