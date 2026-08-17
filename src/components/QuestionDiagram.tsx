import React from 'react';
import { DiagramPrism } from './DiagramPrism';
import { DiagramTriangleSecret } from './DiagramTriangleSecret';
import { DiagramCoordinateOxyz, DiagramFunctionGraph } from './DiagramCoordinateOxyz';
import { DiagramPyramidSABCD, DiagramPyramidSABC } from './DiagramPyramidSABCD';
import { DiagramExam39DerivativeGraph } from './DiagramExam39DerivativeGraph';
import { DiagramExam39CubePyramid } from './DiagramExam39CubePyramid';
import { DiagramExam39StandModel } from './DiagramExam39StandModel';
import { DiagramExam39SquareQuarterCircle } from './DiagramExam39SquareQuarterCircle';
import { DiagramExam39FrustumPyramid } from './DiagramExam39FrustumPyramid';
import { DiagramExam39VariationTable } from './DiagramExam39VariationTable';

interface QuestionDiagramProps {
  type?: string;
  imageUrl?: string;
}

export const QuestionDiagram: React.FC<QuestionDiagramProps> = ({ type, imageUrl }) => {
  const src = imageUrl || (type && (type.startsWith('http') || type.startsWith('data:') || type.startsWith('/')) ? type : null);

  if (src) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-2">
        <img
          src={src}
          alt="Hình minh họa câu hỏi"
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[350px] object-contain rounded-xl border border-slate-300 shadow-sm bg-white p-1"
        />
      </div>
    );
  }

  if (!type) return null;

  switch (type) {
    case 'PRISM':
      return <DiagramPrism />;
    case 'TRIANGLE_SECRET':
      return <DiagramTriangleSecret />;
    case 'OXYZ':
      return <DiagramCoordinateOxyz />;
    case 'GRAPH':
      return <DiagramFunctionGraph />;
    case 'PYRAMID_SABCD':
      return <DiagramPyramidSABCD />;
    case 'PYRAMID_SABC':
      return <DiagramPyramidSABC />;
    case 'EXAM39_DERIVATIVE_GRAPH':
      return <DiagramExam39DerivativeGraph />;
    case 'EXAM39_CUBE_PYRAMID':
      return <DiagramExam39CubePyramid />;
    case 'EXAM39_STAND_MODEL':
      return <DiagramExam39StandModel />;
    case 'EXAM39_SQUARE_QUARTER_CIRCLE':
      return <DiagramExam39SquareQuarterCircle />;
    case 'EXAM39_FRUSTUM_PYRAMID':
      return <DiagramExam39FrustumPyramid />;
    case 'EXAM39_VARIATION_TABLE':
      return <DiagramExam39VariationTable />;
    default:
      return null;
  }
};
