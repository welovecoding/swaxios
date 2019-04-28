class RequestMethod {
  public method: string;
  public url: string;

  constructor(url: string, method: string) {
    this.url = url;
    this.method = method;
  }
}

export {RequestMethod}
