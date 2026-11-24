# Copyright (C) [Jonas Immanuel Frey] - Licensed under GPL
"""Does a flextangle of a given triangle height turn all the way round?

The flextangle is a ring of six tetrahedra (a kaleidocycle). Each has two opposite
edges, the hinges, of length a (the triangle's base), at right angles and d apart;
its four faces are the net's triangles of height h = sqrt(a^2/4 + d^2). The ring's
motion depends on d alone, so it is traced once for d = 1 and then checked for
overlapping tetrahedra at every hinge length a.

python3 rotation_check.py  ->  per height / base: turns fully or collides, and the deepest
overlap of two tetrahedra over a whole turn (neighbours, which share a hinge, shrunk by
0.1 % so that touching there does not count). About 80 s.
"""
import numpy as np


def f_a_n_link(n_angle):
    """Hinge i to hinge i+1: turn about hinge i, d = 1 along x, then 90 degrees about x."""
    n_c, n_s = np.cos(n_angle), np.sin(n_angle)
    return np.array([
        [n_c, 0, n_s, n_c],
        [n_s, 0, -n_c, n_s],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
    ])


# Six quarter turns make half a turn: the ring closes onto hinge 0 turned end over end.
A_N_CLOSED = np.diag([1.0, -1.0, -1.0, 1.0])


def f_a_n_residual(a_n_angle):
    a_n_m = np.eye(4)
    for n_angle in a_n_angle:
        a_n_m = a_n_m @ f_a_n_link(n_angle)
    return (a_n_m - A_N_CLOSED)[:3].ravel()


def f_a_n_jacobian(a_n_angle, n_step=1e-7):
    a_n_0 = f_a_n_residual(a_n_angle)
    return np.stack([(f_a_n_residual(a_n_angle + n_step * np.eye(6)[i]) - a_n_0) / n_step for i in range(6)], axis=1)


def f_a_n_correct(a_n_angle, a_n_tangent=None, a_n_anchor=None):
    """Newton back onto the closed ring; with a tangent, only across it (pseudo-arclength)."""
    for _ in range(50):
        a_n_r = f_a_n_residual(a_n_angle)
        a_n_j = f_a_n_jacobian(a_n_angle)
        if a_n_tangent is not None:
            a_n_r = np.append(a_n_r, a_n_tangent @ (a_n_angle - a_n_anchor))
            a_n_j = np.vstack([a_n_j, a_n_tangent])
        a_n_delta = np.linalg.lstsq(a_n_j, -a_n_r, rcond=None)[0]
        a_n_angle = a_n_angle + a_n_delta
        if np.abs(a_n_delta).max() < 1e-12:
            break
    return a_n_angle


def f_a_n_tangent(a_n_angle):
    return np.linalg.svd(f_a_n_jacobian(a_n_angle))[2][-1]


def f_a_a_n_cycle(n_step=0.01):
    """All ring shapes of one full turn, by stepping along the one free motion."""
    o_rng = np.random.default_rng(1)
    while True:
        a_n_angle = f_a_n_correct(o_rng.uniform(-np.pi, np.pi, 6))
        if np.abs(f_a_n_residual(a_n_angle)).max() < 1e-10 and np.linalg.matrix_rank(f_a_n_jacobian(a_n_angle), 1e-6) == 5:
            break
    a_a_n = [a_n_angle]
    a_n_tangent = f_a_n_tangent(a_n_angle)
    for n_i in range(200000):
        a_n_anchor = a_a_n[-1] + n_step * a_n_tangent
        a_n_next = f_a_n_correct(a_n_anchor.copy(), a_n_tangent, a_n_anchor)
        a_n_new_tangent = f_a_n_tangent(a_n_next)
        a_n_tangent = a_n_new_tangent if a_n_new_tangent @ a_n_tangent > 0 else -a_n_new_tangent
        a_a_n.append(a_n_next)
        # back at the start, every angle the same modulo a full turn
        n_back = np.abs(np.angle(np.exp(1j * (a_n_next - a_a_n[0])))).max()
        if n_i > 100 and n_back < n_step / 2:
            return np.array(a_a_n)
    raise RuntimeError('the motion did not come back to its start')


def f_a_a_a_n_tetra(a_n_angle, n_a):
    """The six tetrahedra's corners in space."""
    a_n_m = np.eye(4)
    a_a_a_n = []
    for n_angle in a_n_angle:
        a_n_link = a_n_m @ f_a_n_link(n_angle)
        a_n_corner = np.array([
            a_n_m @ [0, 0, n_a / 2, 1], a_n_m @ [0, 0, -n_a / 2, 1],
            a_n_link @ [0, 0, n_a / 2, 1], a_n_link @ [0, 0, -n_a / 2, 1],
        ])[:, :3]
        a_a_a_n.append(a_n_corner)
        a_n_m = a_n_link
    return a_a_a_n


A_A_N_EDGE = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
A_A_N_FACE = [(0, 1, 2), (0, 1, 3), (0, 2, 3), (1, 2, 3)]


def f_n_overlap(a_a_n_p, a_a_n_q):
    """Separating axes: how deep two tetrahedra overlap, 0 or less if they do not."""
    a_a_n_axis = []
    for a_a_n in (a_a_n_p, a_a_n_q):
        for (i, j, k) in A_A_N_FACE:
            a_a_n_axis.append(np.cross(a_a_n[j] - a_a_n[i], a_a_n[k] - a_a_n[i]))
    for (i, j) in A_A_N_EDGE:
        for (k, l) in A_A_N_EDGE:
            a_a_n_axis.append(np.cross(a_a_n_p[j] - a_a_n_p[i], a_a_n_q[l] - a_a_n_q[k]))
    n_min = np.inf
    for a_n_axis in a_a_n_axis:
        n_len = np.linalg.norm(a_n_axis)
        if n_len < 1e-9:
            continue
        a_n_axis = a_n_axis / n_len
        a_n_p, a_n_q = a_a_n_p @ a_n_axis, a_a_n_q @ a_n_axis
        n_min = min(n_min, min(a_n_p.max(), a_n_q.max()) - max(a_n_p.min(), a_n_q.min()))
    return n_min


def f_n_overlap_worst(a_a_n_cycle, n_a):
    """Deepest overlap of any two tetrahedra over the whole turn, in units of d."""
    n_worst = -np.inf
    for a_n_angle in a_a_n_cycle:
        a_a_a_n = f_a_a_a_n_tetra(a_n_angle, n_a)
        for i in range(6):
            for j in range(i + 1, 6):
                a_a_n_p, a_a_n_q = a_a_a_n[i], a_a_a_n[j]
                if j - i in (1, 5):
                    # neighbours share a hinge: shrink both a little so touching there is not overlap
                    a_a_n_p = a_a_n_p.mean(0) + 0.999 * (a_a_n_p - a_a_n_p.mean(0))
                    a_a_n_q = a_a_n_q.mean(0) + 0.999 * (a_a_n_q - a_a_n_q.mean(0))
                n_worst = max(n_worst, f_n_overlap(a_a_n_p, a_a_n_q))
    return n_worst


if __name__ == '__main__':
    a_a_n_cycle = f_a_a_n_cycle(0.02)
    print(f'{len(a_a_n_cycle)} shapes over one turn, closure error {max(np.abs(f_a_n_residual(a)).max() for a in a_a_n_cycle):.1e}')
    print(f'each hinge swings through {np.degrees(np.ptp(np.unwrap(a_a_n_cycle, axis=0), axis=0)).round(1)} degrees')
    for n_ratio in [0.9, 0.95, 0.99, 1.0, 1.01, 1.2, 1.5, 2.0, 3.0]:
        n_d = np.sqrt(n_ratio ** 2 - 0.25)  # for a = 1
        n_worst = f_n_overlap_worst(a_a_n_cycle[::2], 1 / n_d) * n_d
        print(f'height / base {n_ratio:4.2f}: a / d {1 / n_d:.3f}, deepest overlap {n_worst:+.4f} x base, {"collides" if n_worst > 1e-6 else "turns fully"}')
