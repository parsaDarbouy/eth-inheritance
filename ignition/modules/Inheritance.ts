import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const InheritanceModule = buildModule("InheritanceModule", (m) => {

  const defaultHeir = m.getParameter("heir");

  const inheritance = m.contract("Inheritance", [defaultHeir]);

  return { inheritance };
});

export default InheritanceModule; 
