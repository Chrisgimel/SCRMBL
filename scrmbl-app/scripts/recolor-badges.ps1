Add-Type -AssemblyName System.Drawing

$mint = [System.Drawing.Color]::FromArgb(255, 0xCA, 0xE0, 0xCE) # THEME.mintLight
$SIZE = 128
$LUMA_INK = 200   # below this luminance = "ink" (recolor to mint)

function Convert-Badge($srcPath, $dstPath) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $small = New-Object System.Drawing.Bitmap $SIZE, $SIZE, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($small)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($src, 0, 0, $SIZE, $SIZE)
    $g.Dispose()
    $src.Dispose()

    # classify each pixel: ink (dark) vs white/interior (light) - flat bool array, index = y*SIZE+x
    $isWhite = New-Object 'bool[]' ($SIZE * $SIZE)
    for ($y = 0; $y -lt $SIZE; $y++) {
        for ($x = 0; $x -lt $SIZE; $x++) {
            $p = $small.GetPixel($x, $y)
            $luma = 0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B
            $isWhite[$y * $SIZE + $x] = $luma -ge $LUMA_INK
        }
    }

    # flood fill from border across white-candidate pixels -> background
    $isBackground = New-Object 'bool[]' ($SIZE * $SIZE)
    $stack = New-Object System.Collections.Generic.Stack[int]
    for ($x = 0; $x -lt $SIZE; $x++) {
        if ($isWhite[0 * $SIZE + $x]) { $stack.Push(0 * $SIZE + $x) }
        if ($isWhite[($SIZE - 1) * $SIZE + $x]) { $stack.Push(($SIZE - 1) * $SIZE + $x) }
    }
    for ($y = 0; $y -lt $SIZE; $y++) {
        if ($isWhite[$y * $SIZE + 0]) { $stack.Push($y * $SIZE + 0) }
        if ($isWhite[$y * $SIZE + ($SIZE - 1)]) { $stack.Push($y * $SIZE + ($SIZE - 1)) }
    }
    while ($stack.Count -gt 0) {
        $idx = $stack.Pop()
        if ($isBackground[$idx] -or -not $isWhite[$idx]) { continue }
        $isBackground[$idx] = $true
        $cx = $idx % $SIZE
        $cy = [int][Math]::Floor($idx / $SIZE)
        if ($cx + 1 -lt $SIZE) { $stack.Push($idx + 1) }
        if ($cx - 1 -ge 0) { $stack.Push($idx - 1) }
        if ($cy + 1 -lt $SIZE) { $stack.Push($idx + $SIZE) }
        if ($cy - 1 -ge 0) { $stack.Push($idx - $SIZE) }
    }

    $out = New-Object System.Drawing.Bitmap $SIZE, $SIZE, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt $SIZE; $y++) {
        for ($x = 0; $x -lt $SIZE; $x++) {
            $idx = $y * $SIZE + $x
            if ($isBackground[$idx]) {
                # background = transparent
                $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } elseif ($isWhite[$idx]) {
                # interior detail (trophy numerals, etc) = stay bright white for contrast
                $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
            } else {
                # icon ink = recolor to mint
                $out.SetPixel($x, $y, $mint)
            }
        }
    }
    $small.Dispose()
    $out.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $out.Dispose()
    Write-Output "Wrote $dstPath"
}

$srcDir = "C:\Users\Chris\SCRMBL\SCRMBL_assets\Badges"
$dstDir = "C:\Users\Chris\SCRMBL\scrmbl-app\public\badges"

Convert-Badge "$srcDir\5.png"              "$dstDir\distance-max.png"
Convert-Badge "$srcDir\Distance 1.png"     "$dstDir\distance1.png"
Convert-Badge "$srcDir\Distance 2.png"     "$dstDir\distance2.png"
Convert-Badge "$srcDir\Distance 3.png"     "$dstDir\distance3.png"
Convert-Badge "$srcDir\Fastest Hike.png"   "$dstDir\fastest.png"
Convert-Badge "$srcDir\PR.png"             "$dstDir\pr.png"
