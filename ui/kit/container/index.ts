export interface ServiceLocator {
  register<T>(name: string, service: T): void;
  resolve<T>(name: string): T;
}

export const createContainer: () => ServiceLocator = () => {
  const services: { [key: string]: any } = {};
  return {
    register<T>(name: string, service: T): void {
      if (services[name]) {
        throw new Error(`Service '${name}' is already registered.`);
      }
      // todo: should extract type name or descriptor
      services[name] = service;
    },
    resolve<T>(name: string): T {
      if (!services[name]) {
        throw new Error(`Service '${name}' not registered.`);
      }
      const service = services[name];
      // todo: should check type name or descriptor.
      return service;
    },
  };
};
