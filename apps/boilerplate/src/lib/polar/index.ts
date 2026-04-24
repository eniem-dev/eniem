import { polarClient } from "../polar";
import { createPolarGateway, type PolarGateway } from "./polar-gateway";

export { createPolarGateway } from "./polar-gateway";
export type { PolarGateway } from "./polar-gateway";

export const polar: PolarGateway = createPolarGateway(polarClient);
