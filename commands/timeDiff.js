module.exports = function() {
    this.timeDiff = function (type) {
        type = type.toLowerCase();
        type = type.trim();
        args = type.split(/\s+/);
        switch (args[0].lower) {
            case "fixed":
            case "fixed_short":
                return timeDiff(args[1], args[2], 0).trim();
            case "fixed_long":
                return timeDiff(args[1], args[2], 1).trim();
            default:
                return humanTimeDiff(args[1], args[2], args[0]);
        }
    }
}

function timeDiff(time1, time2, showZeroDays) {
    var time;
    if (time1 === undefined || time2 === undefined) return;
    if (showZeroDays === undefined) showZeroDays = 0;

    var sec = Math.abs(time2 - time1);
    var days = Math.floor(sec/86400);
    var hours = Math.floor((sec % 86400)/3600);
    var hours2 = Math.floor(sec/3600);
    var minutes = Math.floor((sec % 3600)/60);

    if (days > 0 || showZeroDays > 0) {
        time = days + "d ";
    }
    time = hours.padStart(2,"0") + ":" + minutes.padStart(2,"0");
    return time;
}

function humanTimeDiff(time1, time2, mode) {
    var result;
    if (time1 === undefined || time2 === undefined) return;
    var diff = Math.abs(time1 - time2);
    var d = Math.floor(diff/86400);
    var d_remain = diff % 86400;
    var h = Math.floor(d_remain/3600);
    var h_remain = d_remain % 3600;
    var m = Math.floor(h_remain/60);
    var m_remain = h_remain % 60;

    var ret = "";

    switch(mode) {
        // displays 1 time division tersely, no rounding
        case "short":
            ret = "";
            if (d) {
                return d + "d";
            } else {
                if (h) {
                    return h + "h";
                } else {
                    if (m) {
                        return m + "m";
                    } else {
                        return m_remain + "s";
                    }
                }
            }
        // displays up to 2 time divisions, no rounding
        case "twodivs":
            ret = "";
            if (d) {
                ret = d + " day";
                if (d != 1) {
                    ret += "s";
                }
                if (h) {
                    ret += " " + h + " hour";
                    if (h != 1) {
                        ret +=  "s";
                    }
                }
                return ret;
            } else {
                if (h) {
                    ret = h + " hour";
                    if (h != 1) {
                        ret += "s";
                    }
                    if (m) {
                        ret += " " + m + " minute";
                        if (m != 1) {
                            ret += "s";
                        }
                    }
                    return ret;
                } else {
                    if (m) {
                        ret = m + " minute";
                        if (m != 1) {
                            ret += "s";
                        }
                        if (m_remain) {
                            ret += " " + m_remain + " second";
                            if (m_remain != 1) {
                                ret += "s";
                            }
                        }
                        return ret;
                    } else {
                        ret = m_remain + " second";
                        if (m_remain != 1) {
                            ret += "s";
                        }
                        return ret;
                    }
                }
            }
        // displays 2 time divisions tersely, no rounding
        case "twodivsshort":
            ret = "";
            if (d) {
                ret = d + "d";
                if (h) {
                    ret += " " + h + "h";
                }
            } else {
                if (h) {
                    ret = h + "h";
                    if (m) {
                        ret += " " + m +"m";
                    }
                } else {
                    if (m) {
                        ret = m + "m";
                        if (m_remain) {
                            ret += " " + m_remain + "s";
                        }
                    } else {
                        ret = m_remain + "s";
                    }
                }
            }
            return ret;
        // displays 1 time division, rounded up or down based on next division
        case "round":
            ret = "";
            if (d) {
                if (h >= 12) {
                    d += 1;
                }
                ret = d + " day";
                if (d != 1) {
                    ret += "s";
                }
                return ret;
            } else {
                if (h) {
                    if (m >= 30) {
                        h += 1;
                    }
                    ret = h + " hour";
                    if (h != 1) {
                        ret += "s";
                    }
                    return ret;
                } else {
                    if (m) {
                        if (s >= 30) {
                            m += 1;
                        }
                        ret = m + " minute";
                        if (m != 1) {
                            ret += "s";
                        }
                        return ret;
                    } else {
                        ret = m_remain + " second";
                        if (m_remain != 1) {
                            ret += "s";
                        }
                        return ret;
                    }
                }
            }
        case "shortround":
            ret = "";
            if (d) {
                if (h >= 12) {
                    d += 1;
                }
                ret = d + "d";
                return ret;
            } else {
                if (h) {
                    if (m >= 30) {
                        h += 1;
                    }
                    ret = h + "h";
                    return ret;
                } else {
                    if (m) {
                        if (s >= 30) {
                            m += 1;
                        }
                        ret = m + "m";
                        return ret;
                    } else {
                        ret = m_remain + "s";
                        return ret;
                    }
                }
            }
        case "full":
            ret = "";
            if (d) {
                ret = d + " day";
                if (d != 1) ret += "s";
                if (h || m || m_remain) ret += ", ";
            }
            if (h) {
                ret += h + " hour";
                if (h != 1) ret += "s";
                if (m || m_remain) ret += ", ";
            }
            if (m) {
                ret += m + " minute";
                if (m != 1) ret += "s";
                if (m_remain) ret += ", ";
            }
            if (m_remain) {
                ret += m_remain + " second";
                if (m_remain != 1) ret += "s";
            }
            return ret;
        case "fullshort":
            ret = "";
            if (d) {
                ret = d + "d ";
            }
            if (h) {
                ret += h + "h ";
            }
            if (m) {
                ret += m + "m ";
            }
            if (m_remain) {
                ret += h + "s";
            }
            return ret;
        // displays 1 time division, no rounding. Default if no format specified
        default:
            ret = "";
            if (d) {
                ret = d + " day";
                if (d != 1) ret += "s";
            } else {
                if (h) {
                    ret = h + " hour";
                    if (h != 1) ret += "s";
                } else {
                    if (m) {
                        ret = m + " minute";
                        if (m != 1) ret += "s";
                    } else {
                        if (m_remain) {
                            ret = m_remain + " second";
                            if (m_remain != 1) ret += "s";
                        }
                    }
                }
            }
            return ret;
    }
}