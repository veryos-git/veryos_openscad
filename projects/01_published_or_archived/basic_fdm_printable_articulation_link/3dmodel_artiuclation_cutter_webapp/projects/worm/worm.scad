// example model: a worm, 120 long, lying flat, bending in the plane
$fn = 28;
n = 36;
function p(i) = let(t = i / n) [t * 120 - 60, 14 * sin(t * 360) , 0];
function r(i) = let(t = i / n) 5 + 4 * sin(t * 180);
for (i = [0 : n - 1]) hull() {
    translate(p(i)) sphere(r(i));
    translate(p(i + 1)) sphere(r(i + 1));
}
// head
translate(p(0)) scale([1.4, 1.1, 0.9]) sphere(6.5);
