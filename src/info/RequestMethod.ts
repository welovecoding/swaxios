class RequestMethod {
  public method: string;
  public returnType: string;
  public url: string;

  constructor(url: string, method: string) {
    this.url = url;
    if (method === 'delete' || method === 'head') {
      this.returnType = 'void';
    } else {
      this.returnType = '{}';
    }
    this.method = method;
  }
}

export {RequestMethod};
