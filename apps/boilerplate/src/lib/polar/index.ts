import { polarClient } from "./client";
import { createPolarGateway, type PolarGateway } from "./polar-gateway";

export { polarClient } from "./client";
export { createPolarGateway } from "./polar-gateway";
export type { PolarGateway } from "./polar-gateway";

export const polar: PolarGateway = createPolarGateway(polarClient);
