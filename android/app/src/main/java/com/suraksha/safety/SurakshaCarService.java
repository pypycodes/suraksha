package com.suraksha.safety;

import androidx.annotation.NonNull;
import androidx.car.app.CarAppService;
import androidx.car.app.CarContext;
import androidx.car.app.Screen;
import androidx.car.app.Session;
import androidx.car.app.model.Action;
import androidx.car.app.model.CarColor;
import androidx.car.app.model.MessageTemplate;
import androidx.car.app.model.Pane;
import androidx.car.app.model.PaneTemplate;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import androidx.car.app.validation.HostValidator;
import android.content.Intent;

public class SurakshaCarService extends CarAppService {
    @NonNull
    @Override
    public HostValidator createHostValidator() {
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR;
    }

    @Override
    @NonNull
    public Session onCreateSession() {
        return new Session() {
            @Override
            @NonNull
            public Screen onCreateScreen(@NonNull Intent intent) {
                return new SOSScreen(getCarContext());
            }
        };
    }

    public static class SOSScreen extends Screen {
        public SOSScreen(CarContext carContext) {
            super(carContext);
        }

        @NonNull
        @Override
        public Template onGetTemplate() {
            Action sosAction = new Action.Builder()
                .setTitle("TRIGGER SOS")
                .setBackgroundColor(CarColor.RED)
                .setOnClickListener(() -> {
                    Intent intent = new Intent("com.suraksha.safety.TRIGGER_SOS");
                    getCarContext().sendBroadcast(intent);
                })
                .build();

            return new MessageTemplate.Builder("Suraksha Safety SOS")
                .setHeaderAction(Action.APP_ICON)
                .addAction(sosAction)
                .build();
        }
    }
}
