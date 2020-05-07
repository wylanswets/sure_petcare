# sure_petcare
NodeJS API library for Sure Petcare pet door


### Note on battery info:

Sure Petcare products use 4x AA or 4x C batteries. This is important when reading their battery info and interpreting what it means.

Both AA and C batteries that are non-rechargable have a standard nominal voltage of 1.5v when fully charged. Most embedded computers / electronics run on 5V. When you put 4x 1.5v batteries together you get 6v in total.

As a battery is consumed the voltage will drop lower and lower, which is also a fairly decent way to determine the charge level. Taking in to account that the product most likely runs at 5v and cuts out / doesn't run below 5v, we need to consider the batteries depleted at 5v.

The Sure Petcare api returns a number that seems to indicate the overal voltage being read from the batteries, which is why 6 and higher always shows 100% charge in the app, and closer and closer to 5 shows progressively less charge percentage.

That said, this plugin has a helper function (translateBatteryToPercent) that will convert this number to a percentage based on these findings, and will convert it in to a rounded integer value representing the percentage from 0 to 100% (0% being 5v).

Some sample data from when I was observing the data from the API and what was happening in the app:

Shows 100%:
6.121
6.108
6.044
5.956

Shows 50%:
5.334
5.182
5.134

Shows 25% (and recommends changing the battery soon in the app):
5.01
