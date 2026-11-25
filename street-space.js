// Full sidewalk width on each side of the asphalt; shared by paint and walkers.
export const sidewalkWidth=road=>road.park?10:road.w>=100?30:road.w>=75?24:road.w>=50?17:10;
