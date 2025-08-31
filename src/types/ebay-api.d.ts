declare module 'ebay-api' {
  class eBayApi {
    constructor(options: {
      appId: string | undefined;
      certId: string | undefined;
      devId: string | undefined;
      sandbox: boolean;
    });

    OAuth2: {
      setCredentials(token: string): void;
    };

    buy: {
      browse: {
        search(params: {
          q: string;
          limit: number;
        }): Promise<any>;
      };
    };
  }

  export = eBayApi;
}
