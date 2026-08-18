import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, ApplicationConfig } from '@angular/core';

// Register French locale data so Angular's number/date pipes use French formatting
registerLocaleData(localeFr);

const configWithLocale: ApplicationConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
};

bootstrapApplication(App, configWithLocale)
  .catch((err) => console.error(err));
