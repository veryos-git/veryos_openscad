// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// STL in and out, and a triangle soup as a Manifold.

// Binary or ASCII STL to a triangle soup: x y z of 3 corners per triangle.
export function parse_stl(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const n = buffer.byteLength >= 84 ? view.getUint32(80, true) : 0;
    const binary = buffer.byteLength === 84 + 50 * n;
    if (binary) {
        const positions = new Float32Array(n * 9);
        for (let i = 0, o = 84; i < n; i++, o += 50)
            for (let k = 0; k < 9; k++) positions[i * 9 + k] = view.getFloat32(o + 12 + 4 * k, true);
        return positions;
    }
    const text = new TextDecoder().decode(bytes);
    const numbers = [];
    for (const m of text.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)) numbers.push(+m[1], +m[2], +m[3]);
    if (numbers.length === 0 || numbers.length % 9 !== 0) throw new Error("not an STL file");
    return Float32Array.from(numbers);
}

// Manifold's mesh as a binary STL.
export function write_stl(mesh, name = "veryos") {
    const {vertProperties: p, triVerts: t, numProp: s} = mesh;
    const n = t.length / 3;
    const buffer = new ArrayBuffer(84 + 50 * n);
    const view = new DataView(buffer);
    new Uint8Array(buffer).set(new TextEncoder().encode(name).subarray(0, 80));
    view.setUint32(80, n, true);
    for (let i = 0, o = 84; i < n; i++, o += 50) {
        const [a, b, c] = [t[i * 3] * s, t[i * 3 + 1] * s, t[i * 3 + 2] * s];
        const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
        const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
        const normal = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
        const length = Math.hypot(...normal) || 1;
        normal.forEach((x, k) => view.setFloat32(o + 4 * k, x / length, true));
        [a, b, c].forEach((start, corner) => {
            for (let k = 0; k < 3; k++) view.setFloat32(o + 12 + corner * 12 + 4 * k, p[start + k], true);
        });
    }
    return buffer;
}

// A triangle soup as a Manifold; throws if it is not a closed, watertight shell.
export function manifold_of_soup(wasm, positions) {
    const mesh = new wasm.Mesh({
        numProp: 3,
        vertProperties: positions,
        triVerts: Uint32Array.from({length: positions.length / 3}, (_, i) => i),
    });
    mesh.merge();
    const manifold = new wasm.Manifold(mesh);
    const status = manifold.status();
    if (status !== "NoError") throw new Error(`the model is not a closed, watertight mesh (${status})`);
    return manifold;
}
