uniform float time;
uniform vec2 resolution;
//uniform vec3 cameraPosition;

#define PI 3.14159265359
#define DEG2RAD PI/180.

// Prevents flickering
#define SUPERSAMP 8

// Project camera to world plane with constant worldY (height)
vec3 revProject(vec2 camPos, float worldY, float fov) {
    float worldZ = worldY / (camPos.y * tan(fov*DEG2RAD*.5));
    float worldX = worldY * camPos.x / camPos.y;
    return vec3(worldX, worldY, worldZ);
}

void main() {
    float distanceToCamera = distance(cameraPosition, vec3(gl_FragCoord.xy, 0.0));
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 p = (gl_FragCoord.xy - resolution.xy * 0.5) / resolution.y;
        
        // Define supersample sizes
        float fragsize = 1.0 / resolution.y;
        float supersize = fragsize / float(SUPERSAMP);

        // Define the screenspace horizon [-0.5, 0.5]
        float horizonY = 1.0;
        
        // Clip above horizon (optional)
        if (p.y > horizonY) {
            gl_FragColor = vec4(vec3(0.0), 1.0);
        }
        else {
            // Initialize current fragment intensity
            float intensity = 0.0;
            // Define the current grid displacement
            vec3 displace = vec3(3.0 * sin(2.0 * PI * 0.1), 4.0, cameraPosition.z / 10.0);
            // Define the FOV
            float fov = 90.0;
            
            // Retrieve supersamples
            for (int i = 0; i < SUPERSAMP; i++) {
                for (int j = 0; j < SUPERSAMP; j++) {
                    vec2 superoffset = vec2(i, j) * supersize;
                    // Get worldspace position of grid
                    vec2 gridPos = revProject(p + superoffset - vec2(0.0, horizonY), displace.z, fov).xz;                
                    // Create grid
                    vec2 grid = fract(gridPos - displace.xy) - 0.5;
                    // Make wavy pattern
                    float pattern = 0.7 + 0.6 * sin(gridPos.y - 6.0 * time);
                    
                    // Compute distance from grid edge
                    float dist = max(grid.x * grid.x, grid.y * grid.y);
                    // Compute grid fade distance
                    float fade = min(1.5, pow(1.2, -length(gridPos) + 15.0));
                    // Set brightness
                    float bright = 0.015 / (0.26 - dist);
                    intensity += fade * pattern * bright;
                }
            }
            
            // Define current fragment color
            vec3 col = 0.5 + 0.5 * cos(time + p.yxy + vec3(10.0, 0.0, 20.0));
            // Normalize intensity
            intensity /= float(SUPERSAMP * SUPERSAMP);
            
            gl_FragColor = vec4(intensity * col, 1.0);
        }
        
        gl_FragColor = pow(gl_FragColor, vec4(0.4545));
    
}
