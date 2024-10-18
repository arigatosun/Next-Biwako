// resend.d.ts
declare module "resend" {
    import React from 'react';
  
    interface EmailOptions {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      react?: React.ReactNode;
    }
  
    export class Resend {
      constructor(apiKey: string);
      emails: {
        send(options: EmailOptions): Promise<any>;
      };
    }
}
