import { Composition } from "remotion";
import { DUREE_V17, Verset17 } from "./scenes/Verset17";

// Une composition par scène pendant la fabrication ; le film entier les enchaînera, calé sur la récitation.
export const MyComposition = () => {
  return (
    <Composition
      id="Verset17"
      component={Verset17}
      durationInFrames={DUREE_V17}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
