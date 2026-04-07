import React from 'react';
import { Polygon, PolygonProps } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

export interface TerritoryPolygonProps extends PolygonProps {
  positions: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][];
  color?: string;
  isContested?: boolean;
  strength?: 'low' | 'medium' | 'high';
}

export const TerritoryPolygon: React.FC<TerritoryPolygonProps> = ({
  positions,
  color = '#00E5FF',
  isContested = false,
  strength = 'medium',
  ...props
}) => {
  
  let fillOpacity = 0.2;
  let weight = 2;
  let className = 'territory-pulse';

  if (strength === 'low') {
    fillOpacity = 0.1;
    weight = 1;
    className = 'territory-pulse-slow';
  } else if (strength === 'high') {
    fillOpacity = 0.35;
    weight = 3;
    className = 'territory-pulse-fast';
  }

  if (isContested) {
    className += ' contested-territory';
    // We could add a dashed array or different animation for contested
  }

  return (
    <Polygon
      positions={positions}
      color={color}
      fillColor={color}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: fillOpacity,
        weight: weight,
        className: className,
        ...(props.pathOptions || {})
      }}
      {...props}
    />
  );
};
